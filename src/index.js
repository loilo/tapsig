import log from '@debugger'

const TARGET = Symbol('Proxy target')
export const ALL = Symbol('Catch all')
export const MISSING = Symbol('Catch missing')

/**
 * Checks if a given value is tappable
 * @param  {any}  value  The value to check
 * @return {boolean}     Whether the value is tappable
 */
function isTappable (value) {
  return (typeof value === 'object' || typeof value === 'function') && value !== null
}

/**
 * Call a custom hook on a given injection object
 * @param  {object} target       The original object
 * @param  {string|symbol} name  The property to call on the injection object
 * @param  {object} injectObj    The injection object
 * @return {any}                 The result of the call
 */
function getInjectedProperty (target, name, injectObj) {
  const desc = Object.getOwnPropertyDescriptor(injectObj, name)

  if (desc && typeof desc.get === 'function') {
    return Reflect.apply(desc.get, target, [])
  } else {
    return Reflect.get(injectObj, name)
  }
}

/**
 * Wraps the target object in a Proxy if applicable, returns the value itself if not
 * @param  {any} source       The object to tap
 * @param  {object} inject    The injected properties
 * @param  {object} context   The thisArg context applied to methods on the tapped object
 * @param  {boolean} verbose  If debugging output should be produced
 * @return {any}              The tapped object or its wrapping Proxy
 */
function tapObject (source, inject, context, verbose) {
  // If target can't be or is already tapped, act as an identity function
  if (!isTappable(source) || Reflect.has(source, TARGET)) {
    return source
  }

  log(verbose, 'tap %o', source)

  const proxy = new Proxy(source, {
    has (target, name) {
      if (name === TARGET) return true
      return Reflect.has(target, name)
    },
    construct (target, args) {
      log(verbose, 'construct %o with %o', target, args)

      return tapObject(Reflect.construct(target, args), inject, null, verbose)
    },
    get (target, name) {
      if (name === TARGET) return target

      log(verbose, 'get %o from %o', name, target)

      // If the injected object is a function, create the injection object from that
      const injectObj = (typeof inject === 'function'
        ? inject(target)
        : inject) || Object.create(null)

      // Check if property is shadowed by injection
      const hasInjected = injectObj instanceof Object
        ? injectObj.hasOwnProperty(name)
        : name in injectObj

      // Found property in the injection object
      if (hasInjected) {
        log(verbose, 'property %o shadowed by injected %o', name, injectObj)

        const injectedProperty = getInjectedProperty(target, name, injectObj)

        return tapObject(injectedProperty, inject, typeof injectedProperty === 'function' ? target : null, verbose)

      // Didn't find property in the injection object but have ALL
      } else if (injectObj instanceof Object && Reflect.has(injectObj, ALL)) {
        log(verbose, 'property %o caught by ALL', name)

        const catchAll = Reflect.apply(Reflect.get(injectObj, ALL), target, [ name ])

        return tapObject(catchAll, inject, target, verbose)

      // Found property in the original object
      } else if (Reflect.has(target, name)) {
        return tapObject(Reflect.get(target, name), inject, null, verbose)

      // Didn't find property but have MISSING
      } else if (injectObj instanceof Object && Reflect.has(injectObj, MISSING)) {
        log(verbose, 'property %o caught by MISSING', name)

        const catchMissing = Reflect.apply(Reflect.get(injectObj, MISSING), target, [ name ])

        return tapObject(catchMissing, inject, target, verbose)
      }
    },
    apply (target, thisArg, args) {
      log(verbose, 'call %o with %o as %o', target, args, thisArg)

      return tapObject(Reflect.apply(target, thisArg, args), inject, null, verbose)
    }
  })

  return proxy
}

/**
 * Wraps the target object in a Proxy if applicable, returns the value itself if not
 * @param  {any} source       The object to tap
 * @param  {object} inject    The injected properties
 * @param  {boolean} verbose  If debugging output should be produced
 * @return {any}              The tapped object or its wrapping Proxy
 */
export function tap (source, inject = Object.create(null), verbose = false) {
  return tapObject(source, inject, null, verbose)
}

/**
 * Untaps an object previously tapped if applicable and returns the untapped object
 * @param  {any} proxy       The object to untap
 * @param  {object} inject   The injected properties
 * @param  {object} context  The thisArg context applied to methods on the tapped object
 * @return {any}             The untapped object
 */
export function untap (proxy) {
  if (isTapped(proxy)) {
    return proxy[TARGET]
  } else {
    return proxy
  }
}

/**
 * Checks if a value is tapped
 * @param  {any}  value  The value to check
 * @return {boolean}     Whether the value is tapped
 */
export function isTapped (value) {
  return isTappable(value) && TARGET in value
}
