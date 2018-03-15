const { untap, tap, isTapped } = require('../dist/node.cjs')

test('recognizes non-tapped primitives', () => {
  expect(isTapped(1)).toBe(false)
  expect(isTapped(true)).toBe(false)
  expect(isTapped('string')).toBe(false)
  expect(isTapped(Symbol('Symbol'))).toBe(false)
})

test('recognizes tapped values', () => {
  expect(isTapped(tap({}))).toBe(true)
  expect(isTapped(tap(function () {}))).toBe(true)
  expect(isTapped(tap(class Foo {}))).toBe(true)
})

test('recognizes untapped values', () => {
  expect(isTapped(untap(tap({})))).toBe(false)
  expect(isTapped(untap(tap(function () {})))).toBe(false)
  expect(isTapped(untap(tap(class Foo {})))).toBe(false)
})
