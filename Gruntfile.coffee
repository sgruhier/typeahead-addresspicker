#global module:false
module.exports = (grunt) ->

  # Project configuration.
  grunt.initConfig
    pkg: grunt.file.readJSON("package.json")
    uglify:
      plugin:
        files: [
          expand: true
          cwd: "dist/"
          src: "typeahead-addresspicker.js"
          dest: "dist/"
          ext: ".min.js"
        ]
        options:
          banner: "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - " + "<%= grunt.template.today(\"yyyy-mm-dd\") %>\n" + "<%= pkg.homepage ? \"* \" + pkg.homepage + \"\\n\" : \"\" %>" + "* Copyright (c) <%= grunt.template.today(\"yyyy\") %> <%= pkg.author.name %>;" + " Licensed <%= _.pluck(pkg.licenses, \"type\").join(\", \") %> */"

    coffee:
      plugin:
        files: [
          expand: true
          cwd: "src/"
          src: "*.coffee"
          dest: "dist/"
          ext: ".js"
        ]
      specs :
        files: [
          expand: true
          cwd: 'spec/coffeescripts/'
          src: '*.coffee'
          dest: 'spec/javascripts/'
          ext: '.js'
        ]
      helpers :
        files: [
          expand: true
          cwd: 'spec/coffeescripts/helpers/'
          src: '*.coffee'
          dest: 'spec/javascripts/helpers/'
          ext: '.js'
        ]

    watch:
      files: [
        "src/*.coffee"
        "spec/coffeescripts/**/*.coffee"
      ]
      tasks: [
        "coffee"
        "growl:coffee"
        "jasmine"
        "growl:jasmine"
      ]

    growl:
      coffee:
        title: "CoffeeScript"
        message: "Compiled successfully"
      jasmine :
        title   : 'Jasmine'
        message : 'Tests passed successfully'

    jasmine :
      src : [
        'http://ajax.googleapis.com/ajax/libs/jquery/2.0.2/jquery.min.js',
        'bower_components/typeahead.js/dist/bloodhound.js'
        'bower_components/typeahead.js/dist/typeahead.jquery.js'
        'dist/typeahead-addresspicker.js'
        'spec/javascripts/libs/*.js'
      ]
      options :
        vendor: [
          'http://ajax.googleapis.com/ajax/libs/jquery/2.0.2/jquery.min.js',
          'https://maps.googleapis.com/maps/api/js?sensor=false&libraries=places'
        ]
        specs   : 'spec/javascripts/**/*.js'
        helpers : ['spec/javascripts/helpers/sinon-1.9.0.js', 'spec/javascripts/helpers/**/*.js]']
        '--web-security' : false
        '--local-to-remote-url-access' : true
        '--ignore-ssl-errors' : true
      # coverage:
      #   src: ["dist/typeahead.js", "dist/typeahead-addresspicker.js"]
      #   options:
      #     specs: 'spec/javascripts/**/*.js'
      #     template: require('grunt-template-jasmine-istanbul')
      #     templateOptions:
      #       coverage: 'coverage/coverage.json'
      #       report: [
      #         {
      #           type: 'html',
      #           options: {
      #             dir: 'coverage/html'
      #           }
      #         }
      #       ]


  # Lib tasks.
  grunt.loadNpmTasks "grunt-growl"
  grunt.loadNpmTasks "grunt-contrib-coffee"
  grunt.loadNpmTasks "grunt-contrib-watch"
  grunt.loadNpmTasks "grunt-contrib-uglify"
  grunt.loadNpmTasks "grunt-contrib-jasmine"

  # Default and Build tasks
  mainTasks = [
    "coffee"
    "growl:coffee"
    "jasmine"
    "growl:jasmine"
  ]
  grunt.registerTask "default", mainTasks
  grunt.registerTask "build", mainTasks.concat(["uglify"])
  # grunt.registerTask "test:coverage", ["jasmine:coverage"]

  # Travis CI task.
  grunt.registerTask "travis", [
    "coffee", "jasmine"
  ]
  return
