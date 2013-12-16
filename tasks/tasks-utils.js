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
            template : "(function ($, w) {\n  w.__i18n = (w.__i18n || {});\n\n  $.extend(w.__i18n, [[FILE_CONTENTS]]);\n\n}(jQuery, window));",
            templateFile : null
          }),
          template = options.template;

        if (options.templateFile) {
          template = gruntFile.read(options.templateFile);
        }

        files.map(function (filepath) {
          var fileName = path.basename(filepath, '.yml'),
            messages = gruntFile.readYAML(filepath); //YAML.load(filepath);

          messages = messages.main;

          var outputFile = template.replace("[[FILE_CONTENTS]]", JSON.stringify(messages, null, 2)),
            nameOfOutputFile = outputFolder + fileName.replace('messages', 'i18n') + '.js';

          grunt.log.writeln('Writing file: ' + nameOfOutputFile.yellow);
          gruntFile.write(nameOfOutputFile, outputFile);
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
          cfg = grunt.config();

        var count = 0,
          files = gruntFile.expand(src),
          ezFrontend = cfg['ez-frontend'] = (cfg['ez-frontend'] || {});

        files.forEach(function (filepath) {
          var fileName = path.basename(filepath),
            name = 'i18nTask' + count++;

          var task =  ezFrontend[name] = {
            src : filepath,
            dest : dest + fileName
          };

          grunt.config.set(['ez-frontend', name], task);
        });


      }
    }
  };

  gruntTaskUtils.registerTasks(gruntTasks);

};