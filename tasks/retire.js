/* jshint -W055 */
'use strict';

module.exports = function (grunt) {

   var retire = require('retire/lib/retire'),
      repo    = require('retire/lib/repo'),
      resolve = require('retire/lib/resolve'),
      log     = require('retire/lib/utils').log,
      scanner = require('retire/lib/scanner'),
      fs      = require('fs'),
      path    = require('path'),
      req     = require('request'),
      os      = require('os'),
      async   = require('async');

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
         nodeRepository: 'https://raw.github.com/bekk/retire.js/master/repository/npmrepository.json',
         logger: grunt.log.writeln,
         warnlogger: grunt.log.error,
      });
      var logger = log(options);

      if (!options.nocache) {
         options.cachedir = path.resolve(os.tmpdir(), '.retire-cache/');
      }
      var ignores = options.ignore ? options.ignore.split(',') : [];
      options.ignore = [];
      ignores.forEach(function(e) { options.ignore.push(e); });
      logger.verbose("Ignoring " + JSON.stringify(options.ignore));

      // log (verbose) options before hooking in the reporter
      grunt.verbose.writeflags(options, 'Options');

      // required to throw proper grunt error
      scanner.on('vulnerable-dependency-found', function(e) {
          vulnsFound = true;
      });
      var events = [];
      function once(name, fun) {
         events.push(name);
         grunt.event.once(name, fun);
      }
      function on(name, fun) {
         events.push(name);
         grunt.event.on(name, fun);
      }


      once('retire-js-repo', function() {
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

      once('retire-node-scan', function(filesSrc) {
         if (filesSrc.length === 0) {
            grunt.event.emit('retire-done');
            return;
         }
         var filepath = filesSrc[0];
         if(grunt.file.exists(filepath + '/package.json')) {
            if(options.verbose) {
               grunt.log.writeln('Checking:', filepath);
            }              
            resolve.getNodeDependencies(filepath).on('done', function(dependencies) {
               scanner.scanDependencies(dependencies, nodeRepo, options);
               grunt.event.emit('retire-node-scan', filesSrc.slice(1));        
           });
         } else {
            grunt.log.debug('Skipping. Could not find:', filepath + '/package.json');
            grunt.event.emit('retire-node-scan', filesSrc.slice(1));        
         }
      });

      once('retire-load-js', function() {
         repo.loadrepository(options.jsRepository, options).on('done', function(repo) {
            jsRepo = repo;
            grunt.event.emit('retire-js-repo');
         });
      });

      once('retire-load-node', function() {
         repo.loadrepository(options.nodeRepository, options).on('done', function(repo) {
            nodeRepo = repo;
            grunt.event.emit('retire-node-scan', filesSrc);
         });
      });

      once('retire-done', function() {
         if(!vulnsFound){
            grunt.log.writeln("No vulnerabilities found.");
         }
         events.forEach(function(e) {
            grunt.event.removeAllListeners(e);
         });

         done(!vulnsFound);
      });

      grunt.event.emit(this.target === 'node' ? 'retire-load-node' : 'retire-load-js');

   });

};
