# Tapsig

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Travis](https://img.shields.io/travis/Loilo/tapsig.svg?label=unix&logo=travis)](https://travis-ci.org/Loilo/tapsig)
[![AppVeyor](https://img.shields.io/appveyor/ci/Loilo/tapsig.svg?label=windows&logo=appveyor)](https://ci.appveyor.com/project/Loilo/tapsig)
[![npm](https://img.shields.io/npm/v/tapsig.svg)](https://npmjs.com/package/tapsig)

![Tapsig](tapsig.png)

This tiny library (0.8kb minified & gzipped) tacks custom extensions onto existing JavaScript functions and objects. That makes it incredibly easy to supplement existing JavaScript libraries with custom methods without touching its original code.

It works by wrapping the target in a [Proxy](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy). The Proxy sticks to the tapped library by attaching itself to properties accessed or methods called on it.

This package works in Node.js and in the browser. Note however that the browser *must* support ES2015 Proxies (which are not polyfillable), which leaves out IE11 in particular.

## Table of Contents

* [Installation](#installation)
  * [Include in the Browser](#include-in-the-browser)
  * [Include in Node.js](#include-in-nodejs)
* Usage
  * [Basic Example](#basic-example)
  * [Dynamic Injections](#dynamic-injections)
  * [Naming Conflicts](#naming-conflicts)
  * [Inject Getters](#inject-getters)
  * [Untapping](#untapping)
  * [Catch-Missing and Catch-All](#catch-missing-and-catch-all)
    * [`MISSING`](#missing)
    * [`ALL`](#all)
  * [Checking if an Object is Tapped](#checking-if-an-object-is-tapped)
  * [Masking Values](#masking-values)
  * [Debugging](#debugging)
* ["Tapsig"?](#tapsig-1)


## Installation
Install it from npm:

```bash
npm install --save tapsig
```

### Include in the Browser
You can use this package in your browser with one of the following snippets:

* The most common version. Introduces a global `tapsig` variable, runs in all modern browsers:

  ```html
  <script src="node_modules/tapsig/dist/browser.min.js"></script>

  <!-- or from CDN: -->

  <script src="https://unpkg.com/tapsig"></script>
  ```

* If you're really living on the bleeding edge and use ES modules directly in the browser, you can `import` the package as well:

  ```javascript
  import * as tapsig from "./node_modules/tapsig/dist/browser.esm.min.js"

  // or from CDN:

  import * as tapsig from "https://unpkg.com/tapsig/dist/browser.esm.min.js"
  ```

  As opposed to the first snippet, this will not create a global `tapsig` function.


### Include in Node.js
Include this package in Node.js like you usually do:

```javascript
const tapsig = require('tapsig')
```

If you use `--experimental-modules`, there's a `.mjs` version, too:

```javascript
import * as tapsig from 'tapsig/dist/node.esm'
```


## Usage
### Basic Example
Now that we have grabbed the `tapsig` object, we can start injecting custom properties and methods into a library. Since most of us probably know jQuery, let's take that as an example.

Remember older jQuery versions? They had a `size()` method that was removed in favor of the `length` property.

Now let's re-implement that method. We do so by passing the library we want to wrap and a thing we call an "injection object" to the `tap()` method:

```javascript
const $ = tapsig.tap(jQuery, {
  size () {
    return this.length
  }
})

$('div').size() // Returns some number
```

There are some things to note here:
1. Notice how the `size()` method is available not only on `$` but also on `$('div')`? That's the whole point of Tapsig: it reproduces and attaches itself recursively to every property or method you access on the originally tapped library.

   This also means that if we returned an object or a function from our `size()` method, that return value would also be tapped.
2. The `this` context of the `size()` method (and any other method defined on the injection object) points to the tapped object the method it is called on — in our case that's the tapped `$('div')` collection. If you want to access the underlying *untapped* object, use the [`untap()`](#untapping) method.

### Dynamic Injections
The first point noted at the end of the last section is a feature, but in our example it can be quite unhandy: In most cases, we want to inject our custom properties only under certain circumstances.

In the example above, the `size()` method is not only available on the `$('div')`, but also on the `$` itself. However, `$` is not a jQuery collection and thus `$.size()` would return `undefined`.

That's why we only want to provide the `size()` method on a jQuery collection. For that purpose, we can inject a function instead of an object. The function decides on a case-by-case basis which properties to provide:

```javascript
const $ = tapsig.tap(jQuery, target => {
  // Only add the `size()` method on a jQuery collection
  if (target instanceof jQuery) {
    return {
      size () {
        return this.length
      }
    }
  }

  // If we don't return anything, no custom properties are added
})

$('div').size() // Still returns some number
$.size() // TypeError: $.size is not a function
```

### Naming Conflicts
Injected custom properties will shadow existing ones. In other words, custom properties will always take precedence over builtin properties.

### Inject Getters
You may provide getters in an injection object:

```javascript
const $ = tapsig.tap(jQuery, {
  get version () {
    return jQuery.fn.jquery
  }
})
```

### Untapping
You can unwrap a tapped object with the `untap()` method, e.g. if you need to use the original API in a method call:

```javascript
const $ = tapsig.tap(jQuery, {
  foo () {
    // We want to check if there's a `foo` property
    // in the tapped object:
    return 'foo' in tapsig.untap(this)
  }
})
```

> **Note:** Both the `tap()` and the `untap()` methods are idempotent. Tapping an already tapped object won't do anything, just like untapping a non-tapped object will have no effect.

### Catch-Missing and Catch-All
The Tapsig library exposes the `ALL` and `MISSING` symbols. You can use them as method names in the injection object to achieve certain behaviour.

#### `MISSING`
A method named with the `MISSING` symbol will be used to handle property access for properties that are *not* explicitely defined in the injection object and *not* found in the original tapped API:

```javascript
const $ = tapsig.tap(jQuery, {
  foo: 'bar',
  [tapsig.MISSING] (name) {
    return `no such property '${name}'`
  }
})

$.foo // "bar", as defined in the injection object
$.baz // "no such property 'baz'", returned by the MISSING method
$.ajax // The AJAX function from the jQuery library
```

#### `ALL`
A method named with the `ALL` symbol will be used to handle *every* property access for properties that are *not* explicitely defined in the injection object. This means that the `ALL` method takes precedence even over built-in properties.

```javascript
const $ = tapsig.tap(jQuery, {
  foo: 'bar',
  [tapsig.ALL] (name) {
    return `no such property '${name}'`
  }
})

$.foo // "bar", as defined in the injection object
$.baz // "no such property 'baz'", returned by the ALL method
$.ajax // "no such property 'ajax'", returned by the ALL method
```

> **Warning:** Be **very careful** when using the `ALL` method. It will be called to answer requests for JavaScript-Builtins like `prototype`, literally *any* property. This can lead to unexpected results, so you should always be aware and possibly quite restrictive about which properties you answer:

  ```javascript
  const $ = tapsig.tap(jQuery, {
    [tapsig.ALL] (name) {
      if (name.startsWith('foo_')) {
        return // something you want to achieve with all `foo_` properties
      } else {
        return tapsig.untap(this)[name]
      }
    }
  })
  ```

> **Note:** The results of both the `MISSING` and `ALL` method will be tapped before they go back to the user.

### Checking if an Object is Tapped
You can check if an object is tapped by running `tapsig.isTapped(object)`.

### Masking Values
By default, all injected properties and all results returned from injected functions will be tapped.

If you want to prevent such a value to be tapped, you can use the `mask()` method:

```javascript
const $ = tapsig.tap(jQuery, {
  originalJQuery () {
    // Untap the proxy, then mask it
    return tapsig.mask(tapsig.untap(this))
  }
})

// $.originalJQuery() === jQuery
```

### Tap Promises
There are [edge cases](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Called_on_incompatible_type) where wrapping an object in a Proxy does not work. Promises are one of those.
Therefore, `tapsig` will not tap Promises themselves, but wrap them in another Promise whose resolved result will in turn be tapped.

### Debugging
The Node.js version of Tapsig uses the [debug](https://npmjs.com/package/debug) utility to print logs.

For the sake of bundle size, the browser build uses just a simple `console.log()`. As opposed to the Node.js logs it has to be enabled manually by setting the `verbose` parameter (3rd parameter of `tapsig.tap()`) to `true`.

## "Tapsig"?
It's hard these days to find a good module name that's available on npm. I wanted some playful name related to "tap" and came up with a word in my mother tongue: "tapsig" (roughly pronounced like "tub-zig") is German for "clumsy", the kind you can observe when kittens or toddlers practice their first steps. 🐾
