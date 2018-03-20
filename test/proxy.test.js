const { tap, untap, mask, isTapped } = require('../dist/node.cjs')

const symbol = Symbol('Symbol')

function returnsArg (arg) {
  return arg
}

function returnsMaskedArg (arg) {
  return mask(arg)
}

class ClassApi {}

const objectApi = {
  number: 1,
  boolean: true,
  string: 'string',
  symbol,

  returnsNumber () {
    return 1
  },
  returnsBoolean () {
    return true
  },
  returnsString () {
    return 'string'
  },
  returnsSymbol () {
    return symbol
  },

  returnsObject () {
    return objectApi
  },
  returnsFunction () {
    return returnsArg
  },
  returnsClass () {
    return ClassApi
  },
  returnsArgs (...args) {
    return args
  },
  returnsThis () {
    return this
  }
}

test('does not tap functions\' primitive return values', () => {
  const tappedFn = tap(returnsArg)
  expect(isTapped(tappedFn(0))).toBe(false)
  expect(isTapped(tappedFn(true))).toBe(false)
  expect(isTapped(tappedFn('string'))).toBe(false)
  expect(isTapped(tappedFn(Symbol('Symbol')))).toBe(false)
})

test('taps functions\' non-primitive return values', () => {
  const tappedFn = tap(returnsArg)
  expect(isTapped(tappedFn({}))).toBe(true)
  expect(isTapped(tappedFn(function () {}))).toBe(true)
})

test('does not tap functions\' masked non-primitive return values', () => {
  const tappedFn = tap(returnsMaskedArg)

  const obj = {}
  expect(isTapped(tappedFn(obj))).toBe(false)
  expect(tappedFn(obj)).toBe(obj)

  const fn = function () {}
  expect(isTapped(tappedFn(fn))).toBe(false)
  expect(tappedFn(fn)).toBe(fn)
})

test('returns correct values from tapped functions', () => {
  const numbers = [ 1, 2, 3 ]
  const rawResult = returnsArg(numbers)
  const tappedResult = tap(returnsArg)(numbers)

  expect(rawResult).toBe(numbers)
  expect(tappedResult).toEqual(numbers)
  expect(untap(tappedResult)).toBe(rawResult)
})

test('does not tap primitive object properties', () => {
  const tappedObjectApi = tap(objectApi)

  expect(tappedObjectApi.number).toBe(1)
  expect(tappedObjectApi.boolean).toBe(true)
  expect(tappedObjectApi.string).toBe('string')
  expect(tappedObjectApi.symbol).toBe(symbol)
})

test('does not tap object methods\' primitive return values', () => {
  const tappedObjectApi = tap(objectApi)

  expect(tappedObjectApi.returnsNumber()).toBe(1)
  expect(tappedObjectApi.returnsBoolean()).toBe(true)
  expect(tappedObjectApi.returnsString()).toBe('string')
  expect(tappedObjectApi.returnsSymbol()).toBe(symbol)
})

test('taps non-primitive object properties', () => {
  const tappedObjectApi = tap(objectApi)

  expect(isTapped(tappedObjectApi.returnsObject())).toBe(true)
  expect(isTapped(tappedObjectApi.returnsFunction())).toBe(true)
  expect(isTapped(tappedObjectApi.returnsClass())).toBe(true)
  expect(isTapped(tappedObjectApi.returnsArgs())).toBe(true)
  expect(isTapped(tappedObjectApi.returnsThis())).toBe(true)
})

test('returns correct `this` from object method', () => {
  const tappedObjectApi = tap(objectApi)
  expect(untap(tappedObjectApi.returnsThis())).toBe(objectApi)
})

test('can construct tapped class instances', () => {
  const tappedClass = tap(ClassApi)
  expect(Reflect.construct(tappedClass, [])).toBeInstanceOf(ClassApi)
  expect(isTapped(Reflect.construct(tappedClass, []))).toBe(true)
})
