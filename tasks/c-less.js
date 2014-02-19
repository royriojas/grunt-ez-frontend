/*
 * grunt-r3m c-less
 *
 * Based on the now deprecated grunt-less
 * original repo https://github.com/jachardi/grunt-less
 *
 * modified by royriojas@gmail.com to support copy of resources and concatenating of css files as well as less files
 *
 * Copyright (c) 2012 Jake Harding
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
  'use strict';

  // Grunt utilities.

  var file = grunt.file,
    utils = grunt.util,
    verbose = grunt.verbose,
    log = require('../lib/log')(grunt),
    logVerbose = log.logVerbose,
    // external dependencies
    fs = require('fs'),
    path = require('path'),
    less = require('less'),
    lib = require('../lib/lib'),
    lessCustomFunctions = require('../lib/less-user-functions'),
    url = require('url'),
    format = lib.format,
    trim = lib.trim,
    md5 = lib.md5,
    addNoCache = lib.addNoCache;


  var URL_MATCHER = /url\(\s*[\'"]?\/?(.+?)[\'"]?\s*\)/gi,  //regex used to match the urls inside the less or css files
    DATA_URI_MATCHER = /^data:/gi,                          //regex to test for an url with a data uri
    PROTOCOL_MATCHER = /^http|^https:\/\//gi,               //regex to test for an url with an absolute path
    RELATIVE_TO_HOST_MATCHER = /^\//g,                      //regex to test for an url relative to the host
    IS_LESS_MATCHER = /\.less$/;

  /**
   * test if a given path is a less file
   * @param path
   * @return {Boolean}
   */
  function isLessFile (path) {
    return IS_LESS_MATCHER.test(path);
  }

  function copyFileToNewLocation (src, destDir, relativePathToFile, version, rewritePathTemplate) {
    var dirOfFile = path.dirname(src);

    var urlObj = url.parse(relativePathToFile);
    var relativePath = lib.trim(urlObj.pathname);
    var lastPart = lib.trim(urlObj.search) + lib.trim(urlObj.hash);

    if (relativePath === '') {
      throw new Error('Not a valid url');
    }

    var absolutePathToResource = path.normalize(path.join(dirOfFile,relativePath));

    var md5OfResource = md5(absolutePathToResource);

    var fName = format('{0}', path.basename(relativePath));

    var relativeOutputFn = format(rewritePathTemplate, version , md5OfResource, fName);

    var newPath = path.normalize(path.join(destDir, relativeOutputFn));

    file.copy(absolutePathToResource, newPath, {
      noProcess: ['**/*.{png,gif,jpg,ico,psd,ttf,otf,woff,svg}']
    });

    verbose.writeln(format('===> copied file from {0} to {1}', absolutePathToResource, newPath));
    var outName = relativeOutputFn + lastPart;
    verbose.writeln(format('===> url replaced from {0} to {1}', relativePathToFile, outName));
    return outName;
  }

  /**
   * check if this is a relative (to the document) url
   *
   * We need to rewrite if the url is relative. This function will return false if:
   * - starts with "/", cause it means it is relative to the main domain
   * - starts with "data:", cause it means is a data uri
   * - starts with a protocol
   *
   * in all other cases it will return true
   *
   * @param url the url to test
   * @returns {boolean}
   */
  function checkIfRelativePath (url) {
    return url.match(DATA_URI_MATCHER) ? false : url.match(RELATIVE_TO_HOST_MATCHER) ? false : !url.match(PROTOCOL_MATCHER);
  }

  function rewriteURLS (ctn, src, destDir, options) {

    var version = options.assetsVersion;
    var rewritePathTemplate = options.rewritePathTemplate;

    if (!lib.isNull(ctn)) {
      ctn = ctn.replace(URL_MATCHER, function (match, url) {
        url = trim(url);
        var needRewrite = checkIfRelativePath(url);

        if (needRewrite) {
          var pathToFile = copyFileToNewLocation(src, destDir, url, version, rewritePathTemplate);

          var outputPath = format('url({0})', pathToFile);
          verbose.writeln(format('===> This url will be transformed : {0} ==> {1}', url, outputPath));
          return outputPath;
        }

        return match;
      });

      options.processContent && (ctn = options.processContent(ctn, src));
    }

    return ctn;
  }

  var registerCustomFunctionInLess = function(less, name, fn, thisObj) {
    var tree = less.tree;
    if (!tree.TextOutput) {
      tree.TextOutput = function (value) {
          this.value = value;
      };
      tree.TextOutput.prototype = {
          type: "TextOutput",
          genCSS: function (env, output) {
              output.add(this.toCSS(env));
          },
          toCSS: function (env) {
              return this.value;
          },
          eval: function () { return this }
      };  
    }

    tree.functions[name] = function () {
      // if no thisObj especified use the less object instead
      var returnOutput = fn.apply(thisObj || less, arguments);
      return new tree.TextOutput(returnOutput);
    };    
  }

  var lessProcess = function(srcFiles, destDir, options, callback) {

    var compileLESSFile = function (src, callback) {
      var defaults = lib.extend(options, {
        paths : [],
        filename: src
      });

      defaults.paths.unshift(path.dirname(src));
      var userFunctions = lib.extend(lessCustomFunctions, defaults.userFunctions);
      var thisObj = defaults.userFunctionsThisObj;

      if (userFunctions) {
        var keys = Object.keys(userFunctions);
        keys.forEach(function (fName) {
          var fn = userFunctions[fName];
          registerCustomFunctionInLess(less, fName, fn, thisObj);
        });
      }

      var parser = new less.Parser(defaults);

      var data = file.read(src);

      var beforeParseLess = options.beforeParseLess;

      beforeParseLess && (data = beforeParseLess(data, src));

      if (isLessFile(src)) {

        if (options.customImportData) {
          // adding the imported data
          data = options.customImportData + data;
        }

        verbose.writeln('Parsing ' + src);
        // send data from source file to LESS parser to get CSS
        parser.parse(data, function (err, tree) {
          if (err) {
            callback(err);
          }

          var css = null;
          try {
            css = tree.toCSS({
              compress: options.compress,
              yuicompress: options.yuicompress
            });


            verbose.writeln('=========================================');
            verbose.writeln('Checking if require to rewrite the paths');
            css = rewriteURLS(css, src, destDir, options);

          } catch(e) {
            callback(e);
            return;
          }

          callback(null, css);
        });
      }
      else {
        data = rewriteURLS(data, src, destDir, options);
        callback(null, data);
      }

    };

    utils.async.map(srcFiles, compileLESSFile, function(err, results) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, results.join(options.linefeed || ""));
    });
  };


  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask('cLess', 'Concatenate less or css resources.', function() {

    var me = this,
      data = me.data,
      src = data.src,
      dest = data.dest,
      options = me.options({
        assetsVersion : "",
        banner : '',
        dumpLineNumbers: "",
        customImports : [],
        linefeed : grunt.util.linefeed,
        rewritePathTemplate : 'assets/{0}/{1}/{2}'
//        processContent : function (content, filePath) {
//          return content;
//        },
//        postProcess : function (content, filePath) {
//          return content;
//        }
      });

    if (!src) {
      grunt.warn('Missing src property.');
      return false;
    }

    if (!dest) {
      grunt.warn('Missing dest property');
      return false;
    }

    var customImports = options.customImports;

    if (customImports) {
      verbose.writeln('reading custom imports');
      srcFiles = grunt.file.expand(customImports);
      var importContent = '';
      srcFiles.forEach(function (file) {
        importContent += grunt.file.read(file) + grunt.util.linefeed;
      });

      options.customImportData = importContent;
    }


    var srcFiles = file.expand(src);

    logVerbose('Less src files = ' + srcFiles.join(', '));

    var destDir = path.dirname(dest);

    logVerbose('Less dest = ' + dest);


    var done = me.async();

    lessProcess(srcFiles, destDir, options, function(err, css) {
      if (err) {
        grunt.warn(JSON.stringify(err, null, 2));
        done(false);

        return;
      }

      options.banner && (css = options.banner + css);

      options.postProcess && (css = options.postProcess(css, dest));

      file.write(dest, css);
      grunt.log.writeln('File "' + dest + '" created.');

      done();
    });
    return true;
  });

};
