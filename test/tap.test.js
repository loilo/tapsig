const { tap, isTapped } = require('../dist/node.cjs')

test('does not tap primitives', () => {
  expect(tap(1)).toBe(1)
  expect(tap(true)).toBe(true)
  expect(tap('string')).toBe('string')

  const symbol = Symbol('Symbol')
  expect(tap(symbol)).toBe(symbol)
})

test('taps plain objects', () => {
  expect(tap({ foo: 'bar' })).toEqual({ foo: 'bar' })
})

test('taps functions', () => {
  expect(isTapped(tap(function () {}))).toBe(true)
})

test('taps classes', () => {
  expect(isTapped(tap(class Foo {}))).toBe(true)
})

test('does not tap promises', () => {
  expect(isTapped(tap(Promise.resolve()))).toBe(false)
})

test('taps promise results', () => {
  return tap(Promise.resolve({})).then(result => {
    expect(isTapped(result)).toBe(true)
  })
})

test('taps idempotently', () => {
  const tapped = tap({})
  expect(tap(tapped)).toBe(tapped)
})
