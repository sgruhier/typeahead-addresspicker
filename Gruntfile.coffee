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

    watch:
      files: [
        "src/*.coffee"
      ]
      tasks: [
        "coffee"
        "growl:coffee"
      ]

    growl:
      coffee:
        title: "CoffeeScript"
        message: "Compiled successfully"



  # Lib tasks.
  grunt.loadNpmTasks "grunt-growl"
  grunt.loadNpmTasks "grunt-contrib-coffee"
  grunt.loadNpmTasks "grunt-contrib-watch"
  grunt.loadNpmTasks "grunt-contrib-uglify"

  # Default and Build tasks
  mainTasks = [
    "coffee"
    "growl:coffee"
  ]
  grunt.registerTask "default", mainTasks
  grunt.registerTask "build", mainTasks.concat(["uglify"])

  # Travis CI task.
  grunt.registerTask "travis", [
    "coffee"
  ]
  return
