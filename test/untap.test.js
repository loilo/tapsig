const { untap, tap } = require('../dist/node.cjs')

test('acts as identity for non-tapped values', () => {
  expect(untap(1)).toBe(1)
  expect(untap(true)).toBe(true)
  expect(untap('string')).toBe('string')
  const obj = {}
  const fn = function () {}
  expect(untap(obj)).toBe(obj)
  expect(untap(fn)).toBe(fn)
})

test('untaps plain objects', () => {
  const obj = { foo: 'bar' }
  expect(untap(tap(obj))).toBe(obj)
})

test('untaps functions', () => {
  const fn = function () {}
  expect(untap(tap(fn))).toBe(fn)
})

test('untaps classes', () => {
  class Foo {}
  expect(untap(tap(Foo))).toBe(Foo)
})

test('untaps idempotently', () => {
  const obj = {}
  expect(untap(untap(obj))).toBe(obj)
  expect(untap(untap(tap(obj)))).toBe(obj)
})
