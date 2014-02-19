module.exports = function (grunt) {
  'use strict';

  var path = require('path'),
    cheerio = require('cheerio'),
    gruntTaskUtils = require('../lib/grunt-task-utils.js')(grunt),
    lib = require('../lib/lib.js');


  var testGenerator = {

    getDirectoryNameOfFile : function (file) {
      var name = path.dirname(file);

      var parts = name.split(path.sep);

      if (parts.length > 0) {
        name = parts[parts.length - 1];
      }

      return name;
    },

    createEntryForCoveredFile: function(coveredFiles, file, options) {

      var name = this.getDirectoryNameOfFile(file);

      var configEntry = {
        src : file,
        options : lib.extend(true, {}, options)
      };

      var opts = configEntry.options;

      var coverage = opts.coverage;
      coverage.htmlReport = path.join(coverage.reportFolder, name);

      coverage.src = coveredFiles;

      grunt.config.set(['qunit', name], configEntry);
    },

    createEntryForTestFile: function(entry, grunt, options) {
      var me = this;

      entry.src.forEach(function (file) {
        var content = grunt.file.read(file);
        var $ = cheerio.load(content);
        var coveredFiles = [];

        $('script[data-cover]').each(function () {
          var $this = $(this);
          var src = $this.attr('src');
          var fileDirname = path.dirname(file);
          var rel = path.resolve(fileDirname, src);
          coveredFiles.push(rel);
        });

        if (coveredFiles.length > 0) {
          me.createEntryForCoveredFile(coveredFiles, file, options);
        }
      });
    }
  };

  gruntTaskUtils.registerTasks({
    // **test**
    //
    // Executes only the unit testing task passed as arguments to test. example:
    // `grunt test:identifier` will only run the identifier unit tests reporting the coverage to the console
    test: function (testTask) {
      grunt.task.run(['test-targets-generator', 'qunit:' + testTask]);
    },
    "test-targets-generator" : {
      description: 'Generate the test configuration object for qunit-istambul',
      multiTask: function () {
        var me = this;
        var options = lib.extend(true, {
          '--web-security' : 'no',
          coverage : {
            disposeCollector: true,
            instrumentedFiles: 'temp/',
            reportFolder: 'report/',
            linesThresholdPct: 85
          }
        }, me.options());

        var files = me.files || [];

        files.forEach(function (entry) {
          testGenerator.createEntryForTestFile(entry, grunt, options);
        });
      }
    }
  });
};