module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',    
    lint: {
      files: ['grunt.js', 'src/**/*.ts', 'test/**/*.ts']
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'default'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true
      },
      globals: {
        exports: true
      }
    },
    typescript: {
      base: {
        src: ['src/**/*.ts', 'example/**/*.ts'],
        dest: 'src',
        options: {
          module: 'commonjs', //or amd
          target: 'es5', //or es3
          base_path: 'src',
          sourcemap: 'true'
        }
      }
    },
    mochaTest: {
      files: ['test/**/*.test.js']
    },
    mochaTestConfig: {
      options: {
        reporter: 'tap'        
      }
    }
  });

  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-mocha-test');

  // Default task.
  grunt.registerTask('lint', 'lint');

  grunt.registerTask('default', 'typescript mochaTest watch');

};