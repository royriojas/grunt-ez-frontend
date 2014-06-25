/*
 * based upon grunt-concat
 * https://github.com/eastkiki/grunt-concat
 *
 * Copyright (c) 2012 Dong-il Kim
 * Licensed under the MIT license.
 *
 * Modified by Roy Riojas
 */

module.exports = function(grunt) {
  'use strict';
  var
    gruntTaskUtils = require('../lib/grunt-task-utils.js')(grunt),
    verbose = grunt.verbose,
    request = require("request"),
    gruntFile = grunt.file,
    path = require('path'),
    lib = require('../lib/lib.js');

  var gruntTasks = {
    'validate-templates' : {
      description : 'validate dot Templates',
      multiTask : function () {
        var src = this.data.src || [],
          templateFiles = gruntFile.expand(src);

        gruntTaskUtils.validateTemplates(templateFiles);
      }
    },
    'i18n-from-yml' : {
      description : 'Create i18n files from the corresponding ymls using a given template file or a template string',
      multiTask : function () {
        var me = this,
          data = me.data,
          ymlFiles = data.src,
          outputFolder = data.dest,
          files = gruntFile.expand(ymlFiles),
          options = me.options({
            template : "(function ($, w) {\n  w.__i18n = (w.__i18n || {});\n\n  $.extend(true, w.__i18n, [[FILE_CONTENTS]]);\n\n}(jQuery, window));",
            templateFile : null,
            ignoreKeys: ['main']
          }),
          template = options.template;

        if (options.templateFile) {
          template = gruntFile.read(options.templateFile);
        }

        var writeTransFile = function (obj, nameOfOutputFile) {
          var outputFile = template.replace("[[FILE_CONTENTS]]", JSON.stringify(obj, null, 2));
          grunt.log.writeln('Writing file: ' + nameOfOutputFile.yellow);
          gruntFile.write(nameOfOutputFile, outputFile);
        };

        files.map(function (filepath) {
          var fileName = path.basename(filepath, '.yml'),
            messages = gruntFile.readYAML(filepath); //YAML.load(filepath);

          //messages = messages.main;
          var ignoredKeys = {};
          var defaultObject = {};
          var hasDefaultKeys = false;

          var oFile = fileName.replace('messages', 'i18n') + '.js';

          options.ignoreKeys.forEach(function (key) {
            defaultObject = lib.extend(true, defaultObject, messages[key]);
            if (!hasDefaultKeys) {
              hasDefaultKeys = !!messages[key];
            }
            ignoredKeys[key] = true;
          });

          if (hasDefaultKeys) {
            var nameOfOutputFile = path.join(outputFolder, oFile);
            writeTransFile(defaultObject, nameOfOutputFile);
          }

          Object.keys(messages).forEach(function (key) {
            if (ignoredKeys[key]) {
              return;
            }

            var nameOfOutputFile = path.join(outputFolder, key, oFile);
            writeTransFile(messages[key], nameOfOutputFile);
          });

        });
      }
    },

    'compile-templates' : {
      description : 'create the compiled templates from doT files',
      multiTask : function () {
        var me = this,
          data = me.data || {},
          src = data.src || [],
          templateFiles = gruntFile.expand(src),
          outputFile = data.dest,
          options = me.options({});

        gruntTaskUtils.compileTemplates(
          templateFiles,
          outputFile, options);
      }
    },

    'i18n-to-ez-frontend' : {
      description : 'create the corresponding ez-frontend tasks from a given a set of i18n files in order to generate the minified versions',
      multiTask : function () {
        var me = this,
          data = me.data || {},
          src = data.src,
          dest = data.dest,
          cfg = grunt.config(),
          options = me.options({
            cwd: null
          });

        var count = 0,
          files = gruntFile.expand(src),
          ezFrontend = cfg['ez-frontend'] = (cfg['ez-frontend'] || {});

        files.forEach(function (filepath) {
          var fileName = path.basename(filepath),
            name = 'i18nTask' + count++;

          var outputDest = lib.trim(options.cwd) === '' ? path.join(dest, fileName) : path.join(dest, path.relative(options.cwd, filepath));

          verbose.writeln('i18n dest: ' + outputDest.yellow);
          var task =  ezFrontend[name] = {
            src : filepath,
            dest : outputDest
          };

          grunt.config.set(['ez-frontend', name], task);
        });
      }
    },
    // **css-target**
    //
    // Executes ez-frontend and cLess autoprefixer and csso for a given ez-frontend entry.
    //
    // To use it simply run `grunt css-target:nameOfTarget' and the ez-frontend task will be executed, then the
    // tasks `cLess:nameOfTarget`, `autoprefixer:nameOfTarget` and `csso:nameOfTarget` task are executed too
    "css-target": function ( targetName ) {
      var tasks = lib.format( 'ez-frontend:{0} cLess:{0} autoprefixer:{0} csso:{0}', targetName ).split( ' ' );
      grunt.task.run( tasks );
    },
    // **js-target**
    //
    // Executes `ez-frontend` and `preprocess` and `uglify` for a given `ez-frontend` entry.
    //
    // To use it simply run `grunt js-target:nameOfTarget' and the ez-frontend task will be executed and then
    // the `preprocess:nameOfTarget` and the `uglify:nameOfTarget` will be executed.
    "js-target": function ( targetName ) {
      var tasks = lib.format( 'ez-frontend:{0} preprocess:{0} uglify:{0}', targetName ).split( ' ' );
      grunt.task.run( tasks );
    },

    // ** target **
    // 
    // Executes a target ez-frontend task for both javascript and css
    'target': function () {
      var arr = [].slice.call( arguments );
      var tasks = [];
      arr.forEach(function ( name ) {
        var prefixer = /^css-/.test( name ) ? 'css-target:' : 'js-target:';
        tasks.push( prefixer + name );
      } );
      grunt.task.run( tasks );
    },

  };

  gruntTaskUtils.registerTasks(gruntTasks);

};