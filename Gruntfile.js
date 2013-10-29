'use strict';

module.exports = function(grunt) {

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
      files: ['test-files/*'],
      options: {

      }
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-jshint');


  // By default, lint and retire.
  grunt.registerTask('default', ['jshint', 'retire']);

};
