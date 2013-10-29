'use strict';

module.exports = function (grunt) {

  var retire = require('retire/lib/retire'),
    repo = require('retire/lib/repo'),
    resolve = require('retire/lib/resolve'),
    fs = require('fs'),
    crypto = require('crypto');

  grunt.registerMultiTask('retire', 'Scanner detecting the use of JavaScript libraries with known vulnerabilites.', function () {
    var done = this.async();
    var vulnsFound = false;
    var log = grunt.log.writeln;

    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      verbose: true
    });

    var hash = {
      'sha1': function (data) {
        var shasum = crypto.createHash('sha1');
        shasum.update(data);
        return shasum.digest('hex');
      }
    };

    // log (verbose) options before hooking in the reporter
    grunt.verbose.writeflags(options, 'Options');

    var files = this.files;

    function printResults(file, results) {
      if (!options.verbose) {
        return;
      }
      var log = grunt.log.writeln;
      if (retire.isVulnerable(results)) {
        log = grunt.log.error;
      }
      if (results.length > 0) {
        log(file);
        results.forEach(function (elm) {
          log(' ' + String.fromCharCode(8627) + ' ' + elm.component + ' ' + elm.version);
        });
      }
    }

    function scanJsFile(file, repo) {
      var results = retire.scanFileName(file, repo);
      printResults(file, results);
      var hasVulnerabilities = retire.isVulnerable(results);
      if (!hasVulnerabilities) {
        results = retire.scanFileContent(fs.readFileSync(file), repo, hash);
        printResults(file, results);
      }
      return hasVulnerabilities;
    }

    if (options.jspath) {
      repo.loadrepository('http://localhost:8000/repository/jsrepository.json').on('done', function (repo) {
        files.forEach(function (fileObj) {
          // The source files to be concatenated. The "nonull" option is used
          // to retain invalid files/patterns so they can be warned about.
          grunt.file.expand({nonull: true}, fileObj.src).forEach(function (filepath) {
            // Warn if a source file/pattern was invalid.
            if (!grunt.file.exists(filepath)) {
              grunt.log.error('Source file "' + filepath + '" not found.');
            } else if(grunt.file.isFile(filepath)) {
              //log('Checking: ' + filepath);
              if (scanJsFile(filepath, repo)) {

                if(!vulnsFound ) { // Log first time there is a vulnerable file.
                  grunt.log.error('Vulnerabilities found! Please review log for details.');
                }
                vulnsFound = true;
              }
            }
          });

          done(!vulnsFound);
        });
      });
    }

  });

};
