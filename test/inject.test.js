const { tap, untap, mask, isTapped, ALL, MISSING } = require('../dist/node.cjs')

const api = {
  foo () {
    return 'bar'
  }
}

test('injects additional properties', () => {
  const tappedApi = tap(api, {
    bar () {
      return 'baz'
    }
  })

  expect(tappedApi.foo()).toBe('bar')
  expect(tappedApi.bar()).toBe('baz')
})

test('uses MISSING (only) if property is not available', () => {
  const tappedApi = tap(api, {
    [MISSING] (name) {
      return () => [ name, this ]
    }
  })

  expect(tappedApi.foo()).toBe('bar')
  expect(tappedApi.bar()[0]).toBe('bar')
  expect(untap(tappedApi.bar()[1])).toBe(api)
})

test('uses ALL (only) if property is not available', () => {
  const tappedApi = tap(api, {
    [ALL] (name) {
      if (name === 'foo' || name === 'bar') {
        return [ name, this ]
      } else {
        return untap(this)[name]
      }
    }
  })

  expect(tappedApi.foo[0]).toBe('foo')
  expect(isTapped(tappedApi.foo[1])).toBe(true)
  expect(untap(tappedApi.foo[1])).toBe(api)

  expect(tappedApi.bar[0]).toBe('bar')
  expect(isTapped(tappedApi.bar[1])).toBe(true)
  expect(untap(tappedApi.bar[1])).toBe(api)
})

test('shadows existing properties', () => {
  const tappedApi = tap(api, {
    foo () {
      return 'baz'
    }
  })

  expect(tappedApi.foo()).toBe('baz')
})

test('ignores injection\'s prototypal properties', () => {
  class Injection {
    bar () {
      return 'baz'
    }
  }

  const tappedApi = tap(api, new Injection())

  expect(() => tappedApi.bar()).toThrow(TypeError)
})

test('injects getters', () => {
  const tappedApi = tap(api, {
    get bar () {
      return 'baz'
    }
  })

  expect(tappedApi.bar).toBe('baz')
})

test('provides correct `this` value', () => {
  const tappedApi = tap(api, {
    bar () {
      return this
    },
    get baz () {
      return this
    }
  })

  expect(isTapped(tappedApi.bar())).toBe(true)
  expect(isTapped(tappedApi.baz)).toBe(true)
})

test('takes an injection function', () => {
  const tappedApi = tap(api, target => {
    if (typeof target === 'function') {
      return { funcProp: 'available' }
    } else {
      return { objProp: 'available' }
    }
  })

  expect(tappedApi.funcProp).not.toBeDefined()
  expect(tappedApi.objProp).toBe('available')

  expect(tappedApi.foo.funcProp).toBe('available')
  expect(tappedApi.foo.objProp).not.toBeDefined()
})

test('taps injected results', () => {
  const tappedApi = tap(api, {
    bar: []
  })

  expect(isTapped(tappedApi.bar)).toBe(true)
})

test('handles masked results', () => {
  const tappedApi = tap(api, {
    bar: mask([])
  })

  expect(isTapped(tappedApi.bar)).toBe(false)
  expect(tappedApi.bar).toEqual([])
})
