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
          options : group.options
        };

        grunt.config.set(['preprocess', groupName], preprocessTask);

        var ugGroup = uglify[groupName] = {
          files: {},
          options: group.options
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
          options: lib.extend(group.options, {
            yuicompress: false,
            banner : ''
          })
        };

        grunt.config.set(['cLess', groupName], cLessTask);

        var autoPrefixGroup = autoprefixer[groupName] = {
          src : destination,
          dest: destination,
          options : lib.extend(group.options, {
            browsers : ['last 2 version']
          })
        };

        grunt.config.set(['autoprefixer', groupName], autoPrefixGroup);

        var minGroup = csso[groupName] = {
          files: {},
          options : group.options
        };

        minGroup.files[minifiedDestination] = [destination];

        grunt.config.set(['csso', groupName], minGroup);


      }
    },

    compileTemplates : function (src, dest, options) {
      var opts = {
        ext : '.doT',
        template : '(function (window) { \n  var ns = function (ns, root) {\n    if (!ns) {\n      return null;\n    }\n    var nsParts = ns.split(".");\n    var innerRoot = root || window;\n    for (var i = 0, len = nsParts.length; i < len; i++) {\n      if (typeof innerRoot[nsParts[i]] === "undefined") {\n        innerRoot[nsParts[i]] = {};\n      }\n      innerRoot = innerRoot[nsParts[i]];\n    }\n    return innerRoot;\n  };\n  \n  //[CONTENT]\n  \n}(window));',
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

    beautifier : {
      replacements : [
      // {
      //   replace : /\(\s!!/g,
      //   using : '(!!'
      // }, 
      {
        replace : /!!\s/g, // double bang with one space after
        using : '!!' // removes the extra space at the end leaving only the double bang.
      }, 
      {
        replace : /\(\sfunction/g, // extra space in anonymous functions passed as arguments
        using : '(function' // removes the extra space
      }, 
      {
        replace : /\)\s\)/g,  // closing parenthesis with an space in the middle
        using : '))' // remove the middle space
      }],

      addReplacements : function (replacements) {
        //gruntTasksUtils.beautifier.replacements = gruntTasksUtils.beautifier.replacements || [];
        gruntTaskUtils.beautifier.replacements = gruntTaskUtils.beautifier.replacements.concat(replacements);
      },

      onVerificationFailed: function (content, args) {
        var file = args.file,
          log = grunt.log;

        log.warn('\n\n\n\n*************************************************');
        log.warn(' A file does not conform with the coding styles! ');
        log.warn('*************************************************');
        log.warn('The file ' + file.yellow + ' is not beautified. run: \n\n   ' +
          'grunt jsbeautifier --beautify'.yellow +
          ' \n\nin order to ensure the file is properly formatted then try to build it again.\n\n' +
          'Do not forget to commit the formatted file\n\n'.cyan);
        log.warn('IMPORTANT: '.yellow + 'grunt-js-beautifier ' + 'REWRITE YOUR CODE!\n\n'.cyan +
          'In most situations this is fairly safe... but it is always good to have a backup if things get messed up');
      },
      onBeautified: function (content, args) {
        // TODO: check when doing this replacement is safer
        // example inside strings this could be potentially dangerous
        var replacements = gruntTaskUtils.beautifier.replacements || [];

        var counts = {};
        replacements.forEach(function (entry) {
          var token = entry.using,
            regex = entry.replace;

          counts[token] = {
            count: 0,
            regex: regex
          };
          content = content.replace(regex, function () {
            counts[token].count++;
            return token;
          });
        });

        Object.keys(counts).forEach(function (key) {
          //grunt.log.writeln('Replacing ' + counts[key].regex + ' with: ' + key  + ' ' + )
          var entry = counts[key],
            count = entry.count,
            regex = entry.regex;
          if (count > 0) {
            var msg = lib.format('Replacing {0} with {1}, {2} time(s) on file {3}', regex, key, count, args.file);
            grunt.verbose.writeln(msg);
          }
        });

        return content;
      }
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