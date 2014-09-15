

module.exports = function (grunt) {
  'use strict';

  var gruntTaskUtils = require('../lib/grunt-task-utils.js')(grunt),
    lib = require('../lib/lib.js');

  grunt.registerMultiTask('ez-frontend', 'Easy configuration of tasks to concatenate', function () {
    var me = this;
    var options = lib.extend(true, {
      banner : '',
      bannerFile : null,
      assetsVersion : '',

      cLessOptions: {},
      autoprefixerOptions: {},
      cssoOptions : {
        banner: ''
      },
      preprocessOptions: {},
      uglifyOptions: {}
    }, me.options());

    if (options.bannerFile) {
      // TODO: make it read the file only once adding a cache object to handle the bannerFilePaths
      options.banner = grunt.file.read(options.bannerFile);
    }

    //options.banner = grunt.template.process(options.banner);

    var cfg = grunt.config();

    //var files = grunt.task.normalizeMultiTaskFiles(me);
    var data = me.data;

    var group = {
      name : me.target,
      type : data.type,
      src : data.src,
      dest : data.dest,
      minDest : data.minDest,
      options : options
    };

    gruntTaskUtils.createGroupTask(cfg, group);
  });
};