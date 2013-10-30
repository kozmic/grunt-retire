'use strict';

module.exports = function (grunt) {

   grunt.initConfig({
      jshint: {
         all: [
            'Gruntfile.js',
            'tasks/*.js'
         ],
         options: {
            jshintrc: '.jshintrc'
         }
      },

      // Run the task to smoketest it
      retire: {
         jsPath: ['test-files/*'],
         options: {
            verbose: true,
            packageOnly: true, /* package:false is not implemented! */
            nodeOnly: false,
            jsOnly: false,
            jsRepository: 'https://raw.github.com/bekk/retire.js/master/repository/jsrepository.json',
            nodeRepository: 'https://raw.github.com/bekk/retire.js/master/repository/npmrepository.json'
         }
      }
   });

   // Actually load this plugin's task(s).
   grunt.loadTasks('tasks');

   grunt.loadNpmTasks('grunt-contrib-jshint');


   // By default, lint and retire.
   grunt.registerTask('default', ['jshint', 'retire']);

};
