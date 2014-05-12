var doT = require('dot');
var lib = require('./lib.js');
var path = require('path');
var format = lib.format;

module.exports = function (grunt) {
  'use strict';

  var log = grunt.log,
    verbose = grunt.verbose,
    gruntFile = grunt.file,
    gruntTaskUtils;

  gruntTaskUtils = {

    combineFiles: function () {
      var toString = Object.prototype.toString;
      var trim = String.prototype.trim;
      var args = [].slice.call( arguments );
      var files = [];

      args.forEach(function ( entry ) {
        if ( typeof entry === 'string' ) {
          files.push( entry );
          return;
        }
        if ( toString.call( entry ) === '[object Object]' ) {
          if ( toString.call( entry.src ) === '[object Array]' ) {
            var outFiles = entry.src.map(function ( subEntry ) {
              return path.join( trim.call( entry.cwd ), subEntry );
            } );
            files = files.concat( outFiles );
          }
        }
      } );
      return files;
    },

    createMinFromRegular: function (dest) {
      return this.insertRev(dest, 'min');
    },

    insertRev : function (dest, rev, min) {
      var rgex = /(.+)\.(\w+)$/gi;
      return dest.replace(rgex, lib.format('$1{0}{1}.$2', rev ? '.' + rev : '', min ? '.min' : ''));
    },

    inferType: function (dest) {
      var rgex = /(.+)\.(\w+)$/gi;
      return dest.replace(rgex, '$2');
    },

    createGroupTask : function (cfg, group) {
      var me = this;
      var groupName = group.name;
      var destination = group.dest;
      if (lib.isNull(destination)) {
        var msg = "dest field on group " + groupName + " is required";
        log.error(msg);
        throw new Error(msg);
      }

      destination = me.insertRev(destination, group.options.assetsVersion);

      var type = group.type || me.inferType(destination);

      var minifiedDestination = group.minDest || me.createMinFromRegular(destination);

      if (type === 'js') {
        var preprocess = cfg.preprocess = (cfg.preprocess || {});
        var uglify = cfg.uglify = (cfg.uglify || {});

        var preprocessTask = preprocess[groupName] = {
          src: group.src,
          dest: destination,
          options : lib.extend(true, {}, group.options, group.options.preprocessOptions)
        };

        grunt.config.set(['preprocess', groupName], preprocessTask);

        var ugGroup = uglify[groupName] = {
          files: {},
          options: lib.extend(true, {}, group.options, group.options.uglifyOptions)
        };

        ugGroup.files[minifiedDestination] = [destination];

        grunt.config.set(['uglify', groupName], ugGroup);

      }
      if (type === 'css') {
        var cLess = cfg.cLess = (cfg.cLess || {});
        var csso = cfg.csso = (cfg.csso || {});
        var autoprefixer = cfg.autoprefixer = (cfg.autoprefixer || {});

        var cLessTask = cLess[groupName] = {
          src: group.src,
          dest: destination,
          options: lib.extend(true, {
            yuicompress: false,
            banner : ''
          }, group.options, group.options.cLessOptions)
        };

        grunt.config.set(['cLess', groupName], cLessTask);

        var autoPrefixGroup = autoprefixer[groupName] = {
          src : destination,
          dest: destination,
          options : lib.extend(true, {
            browsers : ['last 2 version']
          }, group.options, group.options.autoprefixerOptions)
        };

        grunt.config.set(['autoprefixer', groupName], autoPrefixGroup);

        var minGroup = csso[groupName] = {
          files: {},
          options : lib.extend(true, {}, group.options, group.options.cssoOptions)
        };

        minGroup.files[minifiedDestination] = [destination];

        grunt.config.set(['csso', groupName], minGroup);


      }
    },

    compileTemplates : function (src, dest, options) {
      var opts = {
        ext : '.doT',
        template : '(function (window) { \n  var ns = function (ns, root) {\n    if (!ns) {\n      return null;\n    }\n    var nsParts = ns.split(".");\n    var innerRoot = root || window;\n    for (var i = 0, len = nsParts.length; i < len; i++) {\n      if (typeof innerRoot[nsParts[i]] === "undefined") {\n        innerRoot[nsParts[i]] = {};\n      }\n      innerRoot = innerRoot[nsParts[i]];\n    }\n    return innerRoot;\n  };\n  \n  //[[CONTENT]]\n  \n}(window));',
        templateFile : null,
        objNamespace : '__dotTemplates',
        normalizeName : function (filename) {
          var t = /-(.)/g;
          return filename.replace(t, function (a, b) {
            return b.toUpperCase();
          });
        }
      };

      lib.extend(opts, options);

      if (opts.templateFile) {
        opts.template = gruntFile.read(opts.templateFile);
      }

      var sourceFiles = gruntFile.expand(src);

      var tplContent = lib.format('var obj = ns("{0}");\n', opts.objNamespace);

      sourceFiles.forEach(function (ele, i) {
        var fileName = path.basename(ele, opts.ext);
        log.writeln('compiling template : ' + fileName);

        var content = gruntFile.read(ele);

        try {
          var templateFn = doT.compile(content);
          var name = opts.normalizeName(fileName);

          tplContent += lib.format('obj["{0}"] = {1};\n', name, templateFn.toString().replace('function anonymous', 'function '));

          verbose.writeln('template ' + fileName + ': OK');
        } catch (ex) {
          //log.error('template ' + ele + ': failed to compile');
          //log.error('error: ' + ex.message);
          var message = lib.format('{0} failed : {1}. {2}', templateFn, ele, ex.message);
          throw new Error(message);
        }
      });

      grunt.log.ok('file created: ' + dest);
      gruntFile.write(dest, opts.template.replace('//[[CONTENT]]', tplContent));

    },

    registerTasks : function (gruntTasks) {
      // Register tasks
      Object.keys(gruntTasks).forEach(function (tName) {

        var task = gruntTasks[tName],
          multiTask = task.multiTask,
          description = lib.trim(task.description) || 'Task with name ' + tName;

        if (typeof multiTask === 'function') {
          grunt.registerMultiTask(tName, description, multiTask);
        }
        else {
          grunt.registerTask(tName, task);
        }
      });
    },

    validateTemplates : function (templates) {

      var templateFiles = gruntFile.expand(templates);

      var passed = 0;
      var failed = 0;


      templateFiles.forEach(function (ele, i) {
        var fileName = path.basename(ele);
        log.writeln('processing template : ' + fileName);
        var content = gruntFile.read(ele);

        try {
          var template = doT.compile(content);
          verbose.writeln('template ' + ele + ': OK');
          passed++;
        } catch (ex) {
          failed++;
          log.error('template ' + ele + ': failed to compile');
          log.error('error: ' + ex.message);
        }
      });
      if (failed > 0) {
        log.error(format('Templates validating result passed: {0}, failed: {1}, total : {2}', passed, failed, passed + failed));
        return false;
      }
      log.writeln('=========================================');
      log.writeln(format('Templates processed : {0}', passed));
    }
  };

  return gruntTaskUtils;
};