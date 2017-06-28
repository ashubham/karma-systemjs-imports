'use strict';
var path = require('path');

/**
 * Helper for mapping include file paths to karma file patterns - served, included, but not watched
 * @param path {string}
 * @returns {object}
 */
var createIncludePattern = function(path) {
    return {
        pattern: path,
        included: true,
        served: true,
        watched: false
    };
};


/**
 * Run during karma initialisation.
 * Alters the karma configuration to use SystemJS.
 * @param config {object}
 */
var initSystemjs = function(config) {

  var kSystemjsConfig = config.systemjs || {};
  kSystemjsConfig.importFiles = kSystemjsConfig.importFiles.map(function(file) {
      let paths = path.parse(file);
      return path.join(paths.dir, paths.name);
  })

  // Adds karma-systemjs adapter.js to end of config.files
  config.files.push(createIncludePattern(path.join(__dirname, 'adapter.js')));

  // Adding configuration to be passed to the adapter running on the browser
  config.client.systemjs = {
    importFiles: kSystemjsConfig.importFiles,
    strictImportSequence: kSystemjsConfig.strictImportSequence
  };
};
initSystemjs.$inject = ['config'];

module.exports = initSystemjs;
