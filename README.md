# karma-systemjs-imports
[![Build Status](https://travis-ci.org/ashubham/karma-systemjs-imports.svg?branch=master)](https://travis-ci.org/ashubham/karma-systemjs-imports)

Add system imports when unit testing with Karma.

Plays nicely along with `<script>` imports. Useful for gradual migration of unit tests from
Javascript -> Typescript/ES6.

```
$ npm i karma-systemjs-imports --save-dev
```
## Simple Usage

```javascript
// karma.conf.js or grunt karma config
plugins: [
    'karma-systemjs-imports',
    // Other plugins
]

frameworks: ['jasmine', 'systemjs-imports'],
browsers: ['Chrome],
files: [/* Files to import normally using scripts */],
systemjs: {
    /*
        List of files that will be imported using System.import
        before karma starts running the tests.
    */
    importFiles: grunt.file.expand([
        'app/src/**/*-spec.ts' // Or ES6 Modules.
    ])
}
```

## Caveats

This plugin assumes:
- SystemJS is already loaded on the global window object.
- Your test files are already transpiled/compiled.
- A systemJS config is defined which, enables loading the modules via System.import

