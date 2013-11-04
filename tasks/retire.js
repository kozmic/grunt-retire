/* jshint -W055 */
'use strict';

module.exports = function (grunt) {

   var retire = require('retire/lib/retire'),
      repo    = require('retire/lib/repo'),
      resolve = require('retire/lib/resolve'),
      scanner = require('retire/lib/scanner'),
      fs      = require('fs'),
      req     = require('request'),
      async = require('async');

   grunt.registerMultiTask('retire', 'Scanner detecting the use of JavaScript libraries with known vulnerabilites.', function () {
      var done = this.async();
      var jsRepo = null;
      var nodeRepo = null;
      var vulnsFound = false;
      var filesSrc = this.filesSrc;
      var request = req;
      
      // Merge task-specific and/or target-specific options with these defaults.
      var options = this.options({
         verbose: true,
         packageOnly: true, 
         jsRepository: 'https://raw.github.com/bekk/retire.js/master/repository/jsrepository.json',
         nodeRepository: 'https://raw.github.com/bekk/retire.js/master/repository/npmrepository.json'
      });
      if (options.proxy) {
         request = request.defaults({'proxy' : options.proxy})
         grunt.log.writeln('Using proxy:', options.proxy);
      }


      // log (verbose) options before hooking in the reporter
      grunt.verbose.writeflags(options, 'Options');

      scanner.registerWarnLogger(grunt.log.error);
      scanner.registerInfoLogger(grunt.log.writeln);

      grunt.event.once('retire-js-repo', function() {
         filesSrc.forEach(function(filepath) {
            if(grunt.file.exists(filepath) && filepath.match(/\.js$/) && grunt.file.isFile(filepath)) {
               if(options.verbose) {
                  grunt.log.writeln('Checking:', filepath);
               }
               scanner.scanJsFile(filepath, jsRepo, options);
            } else {
               grunt.log.debug('Skipping none Javascript file:', filepath);
            }
         }); 
         grunt.event.emit('retire-done');        
      });

      grunt.event.on('retire-node-scan', function(filesSrc) {
         if (filesSrc.length == 0) {
            grunt.event.emit('retire-done');
            return;
         }
         var filepath = filesSrc[0];
         if(grunt.file.exists(filepath + '/package.json')) {
            if(options.verbose) {
               grunt.log.writeln('Checking:', filepath);
            }              
            resolve.getNodeDependencies(filepath).on('done', function(dependencies) {
               scanner.scanDependencies(dependencies, nodeRepo);
               grunt.event.emit('retire-node-scan', filesSrc.slice(1));        
           });
         } else {
            grunt.log.debug('Skipping. Could not find:', filepath + '/package.json');
            grunt.event.emit('retire-node-scan', filesSrc.slice(1));        
         }
      });

      grunt.event.once('retire-load-js', function() {
         grunt.log.writeln('Downloading JS repository from: ' + options.jsRepository + " ...");
         request.get(options.jsRepository, function (e, r, jsRepResp) {
            jsRepo = JSON.parse(retire.replaceVersion(jsRepResp));
            grunt.event.emit('retire-js-repo');
         });
      });

      grunt.event.once('retire-load-node', function() {
         grunt.log.writeln('Downloading node repository from: ' + options.nodeRepository + " ...");
         request.get(options.nodeRepository, function (e, r, nodeRepResp) {
            nodeRepo = JSON.parse(retire.replaceVersion(nodeRepResp));
            grunt.event.emit('retire-node-scan', filesSrc);
         });
      });

      grunt.event.once('retire-done', function() {
         if(!vulnsFound){
            grunt.log.writeln("No vulnerabilities found.");
         }
         done(!vulnsFound);
      });

      grunt.event.emit(this.target === 'node' ? 'retire-load-node' : 'retire-load-js');

   });

};
