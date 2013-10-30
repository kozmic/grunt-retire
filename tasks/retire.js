/* jshint -W055 */
'use strict';

module.exports = function (grunt) {

   var retire = require('retire/lib/retire'),
      repo = require('retire/lib/repo'),
      resolve = require('retire/lib/resolve'),
      fs = require('fs'),
      crypto = require('crypto'),
      request = require('request'),
      async = require('async');

   grunt.registerMultiTask('retire', 'Scanner detecting the use of JavaScript libraries with known vulnerabilites.', function () {
      var done = this.async();
      var filesSrc = this.filesSrc;

      var vulnsFound = false;

      // Merge task-specific and/or target-specific options with these defaults.
      var options = this.options({
         verbose: true,
         packageOnly: true, /* package:false is not implemented! */
         nodeOnly: false,
         jsOnly: false,
         jsRepository: 'https://raw.github.com/bekk/retire.js/master/repository/jsrepository.json',
         nodeRepository: 'https://raw.github.com/bekk/retire.js/master/repository/npmrepository.json'
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


      function scanJsFile(file, repo) {
         var results = retire.scanFileName(file, repo);
         if (!retire.isVulnerable(results)) {
            results = retire.scanFileContent(fs.readFileSync(file), repo, hash);
         }
         printResults(file, results);
      }

      function printResults(file, results) {
         var log = grunt.log.writeln;
         if (retire.isVulnerable(results)) {
            log = grunt.log.error;
            vulnsFound = true;
         }
         if (results.length > 0) {
            log(file);
            results.forEach(function(elm) {
               var vuln = '';
               if (retire.isVulnerable([elm])) {
                  vuln = ' has known vulnerabilities: ' + elm.vulnerabilities.join(' ');
               }
               log(' ' + String.fromCharCode(8627) + ' ' + elm.component + ' ' + elm.version + vuln);
            });
         }
      }

      function printParent(comp) {
         if ('parent' in comp) {
            printParent(comp.parent);
         }
         console.log(new Array(comp.level).join(' ') + (comp.parent ? String.fromCharCode(8627) + ' ' : '') + comp.component + ' ' + comp.version);
      }



      // I'm really sorry for all this horrible nesting! Should be rewritten.

      request.get(options.jsRepository, function (e, r, jsRepResp) {

         if(!options.nodeOnly) {
            grunt.log.writeln('JS repository loaded from:', options.jsRepository);
            var jsRepositoryContent = JSON.parse(retire.replaceVersion(jsRepResp));

            // Check for vulnerabilities in javascript-files
            filesSrc.forEach(function(filepath) {
               if(grunt.file.exists(filepath) && filepath.match(/\.js$/)) {
                  if(options.verbose) {
                     grunt.log.writeln('Checking:', filepath);
                  }

                  scanJsFile(filepath, jsRepositoryContent);
               } else {
                  grunt.log.debug('Skipping none Javascript file:', filepath);
               }
            });
         }

         request.get(options.nodeRepository, function (e, r, nodeRepResp) {
            if(!options.jsOnly) {

               grunt.log.writeln('Node repository loaded from:', options.nodeRepository);
               var nodeRepositoryContent = JSON.parse(retire.replaceVersion(nodeRepResp));

               // Check for vulnerabilities in package.json
               var pkg = grunt.file.readJSON('package.json');

               for (var i in pkg.dependencies) {
                  var results = retire.scanNodeDependency(pkg.dependencies[i], nodeRepositoryContent);
                  if (retire.isVulnerable(results)) {
                     vulnsFound = true;
                     var result = results[0]; //Only single scan here
                     console.warn(result.component + ' ' + result.version + ' has known vulnerabilities: ' + result.vulnerabilities.join(' '));
                     if (result.parent) {
                        printParent(result);
                     }
                  }
               }

               if(!pkg.dependencies) {
                  grunt.log.debug('No dependencies found in package.json (note: we dont check devDependencies since they are only used locally).');
               }
               if(!options.packageOnly) {
                  grunt.log.debug('\'package: false\' is not implemented in grunt-plugin, using \'true\'.');
               }
            }

            if(!vulnsFound){
               grunt.log.writeln("No vulnerabilities found.");
            }
         });

      });


   });

};
