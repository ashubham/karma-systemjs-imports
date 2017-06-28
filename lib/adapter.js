(function(window) {
  'use strict';
  var adapter = {
    /**
     * Handles calling System.import() for files where each import is made in parallel, returning a single promise
     * that resolves once all imports have completed.
     * @param System {object}
     * @param Promise {object}
     * @param files {object}
     * @param importRegexps {object[]}
     * @returns {promise}
     */
    parallelImportFiles: function(System, Promise, files) {
      // Run all imports in parallel

      var importPromises = files.map(function(file) {
        return System.import(file);
      });
      return Promise.all(importPromises);
    },

    /**
     * Chains a System.import() call onto an existing promise, returning the new promise.
     * @param promise {promise}
     * @param moduleName {string}
     * @param System {object}
     * @returns {promise}
     */
    chainImport: function(promise, moduleName, System) {
      return promise.then(function() {
        return System.import(moduleName);
      });
    },

    /**
     * Handles calling System.import() for files where each import promise is chained into the next import promise,
     * returning a promise that resolves once the last import has completed.
     * @param System {object}
     * @param Promise {object}
     * @param files {object}
     * @param importRegexps {object[]}
     * @returns {promise}
     */
    sequentialImportFiles: function(System, Promise, files, importRegexps) {
      // Chain import promises to maintain sequence
      return files.reduce(function(promise, file) {
          return adapter.chainImport(promise, file, System);
      }, Promise.resolve());
    },

    /**
     * Calls System.import on all the files that match one of the importPatterns.
     * Returns a single promise which resolves once all imports are complete.
     * @param System {object}
     * @param Promise {object}
     * @param files {object} key/value map of filePaths to change counters
     * @param importRegexps {RegExp[]}
     * @param [strictImportSequence=false] {boolean} If true, System.import calls are chained to preserve sequence.
     * @returns {promise}
     */
    importFiles: function(System, Promise, files, strictImportSequence) {
      if (strictImportSequence) {
        return adapter.sequentialImportFiles(System, Promise, files)
      } else {
        return adapter.parallelImportFiles(System, Promise, files)
      }
    },

    /**
     * Has SystemJS load each test suite, then starts Karma
     * @param karma {object}
     * @param System {object}
     * @param Promise {object}
     */
    run: function(karma, System, Promise) {
      // Fail fast if any of the dependencies are undefined
      if (!karma) {
        (console.error || console.log)('Error: Not setup properly.  window.__karma__ is undefined');
        return;
      }
      if (!System) {
        (console.error || console.log)('Error: Not setup properly.  window.System is undefined');
        return;
      }
      if (!Promise) {
        (console.error || console.log)('Error: Not setup properly.  window.Promise is undefined');
        return;
      }

      // Stop karma from starting automatically on load
      karma.loaded = function() {

        // Convert the 'importPatterns' into 'importRegexps'
        var importFiles = karma.config.systemjs.importFiles;

        // Import each test suite using SystemJS
        var testSuitePromise;
        try {
          testSuitePromise = adapter.importFiles(System, Promise, importFiles, karma.config.systemjs.strictImportSequence);
        } catch (e) {
          karma.error(adapter.decorateErrorWithHints(e, System));
          return;
        }

        // Once all imports are complete...
        testSuitePromise.then(function () {
          karma.start();
        }, function (e) {
          karma.error(adapter.decorateErrorWithHints(e, System));
        });
      };
    },

    /**
     * Checks errors to see if they match known issues, and tries to decorate them
     * with hints on how to resolve them.
     * @param err {string}
     * @param System {object}
     * @returns {string}
     */
    decorateErrorWithHints: function(err, System) {
      err = String(err);
      // Look for common issues in the error message, and try to add hints to them
      switch (true) {
        // Some people use ".es6" instead of ".js" for ES6 code
      case /^Error loading ".*\.es6" at .*\.es6\.js/.test(err):
        return err + '\nHint: If you use ".es6" as an extension, ' +
          'add this to your SystemJS paths config: {"*.es6": "*.es6"}';
      case /^TypeError: Illegal module name "\/base\//.test(err):
        return err + '\nHint: Is the working directory different when you run karma?' +
          '\nYou may need to change the baseURL of your SystemJS config inside your karma config.' +
          '\nIt\'s currently checking "' + System.baseURL + '"' +
          '\nNote: "/base/" is where karma serves files from.';
      }

      return err;
    }
  };

  if (window.System) {
    adapter.run(window.__karma__, window.System, window.Promise);
  } else {
    throw new Error('SystemJS should be on global scope');
  }
})(window);