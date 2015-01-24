module.exports = function (grunt) {
  grunt.initConfig({
    handlebars: {
      compile: {
        options: {
          namespace: 'SlideVendorTemplates',

          processName: function (filePath) {
            return filePath.replace(/^templates\//, '').replace(/\.hbs$/, '');
          }
        },

        files: {
          'js/templates.js': 'templates/*.hbs'
        }
      }
    },

    jshint: {
      files: ['js/app.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    sass: {
      dist: {
        options: {
          sourcemap: 'none'
        },

        files: {
          'css/app.css': 'scss/app.scss'
        }
      }
    },

    watch: {
      jshint: {
        files: ['js/app.js'],
        tasks: ['jshint']
      },

      sass: {
        files: ['scss/**/*.scss'],
        tasks: ['sass']
      },

      handlebars: {
        files: ['templates/**/*.hbs'],
        tasks: ['handlebars']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-handlebars');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['handlebars', 'sass']);
};
