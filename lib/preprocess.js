module.exports = function (grunt) {
  'use strict';
  var
    fs = require("fs"),
    path = require('path'),
    lib = require('../lib/lib'),
    format = lib.format,
    log = require('./log')(grunt),
    logVerbose = log.logVerbose,
    trim = lib.trim,
    extend = lib.extend,
    isNull = lib.isNull,
    verbose = grunt.verbose,
    file = grunt.file;


// Please see the grunt documentation for more information regarding task and
// helper creation: https://github.com/cowboy/grunt/blob/master/docs/toc.md

// ==========================================================================
// TASKS
// ==========================================================================


  //var commandTokenRegex = /\[\s*(\w*)\s*([\w="'-.\/\s]*)\s*\]/gi;


  function doParse(value) {
    try {
      return JSON.parse(value);
    }
    catch(ex) {
      verbose.writeln('The value was not parsed properly. Returning it as text, ' + ex.message + ', ' + value);
      return value;
    }
  }

  function parseAttributes(c) {
    var obj = {};
    var parts = trim(c).split(' ');
    for (var i = 0, len = parts.length; i < len; i++) {
      var subParts = trim(parts[i]).split('=');
      var twoParts = subParts.length > 1;
      var value = twoParts ? trim(subParts[1]).replace(/^"|"$|^'|'$/gi, '') : '';

      if (subParts.length > 1 && value.length > 0) {
        obj[subParts[0]] = doParse(value);
      }
    }
    return obj;
  }

  function processCommand(a, b, c, dirOfFile) {
    verbose.writeln(format('Token found ==> {0}, {1}, {2}, {3}', a, b, c, dirOfFile));
    if (b === 'INCLUDE') {
      verbose.writeln('Executing INCLUDE command');
      var options = {
        removeLineBreaks : true,
        escapeQuotes : true
      };
      extend(options, parseAttributes(c));
      verbose.writeln('INCLUDE ATTRS \n', JSON.stringify(options, null, 2));

      var pathOfFile = path.normalize(path.join(dirOfFile, options.src));
      verbose.writeln('path of file to read ' + pathOfFile);

      var content = '';

      try {
        content = file.read(pathOfFile);
        if (options.removeLineBreaks) {
          content = content.replace(/(\r\n|\n|\r)/gm,"");
        }
        if (options.escapeQuotes) {
          content = content.replace(/'|"/gi,"\\$&");
        }
      }
      catch (ex) {
        grunt.log.error('Unable to read "' + pathOfFile);
      }

      return trim(content);
    }
    return a;
  }

  function findTokens(src, dirOfFile, commandTokenRegex) {
    src = src.replace(commandTokenRegex, function (a, b, c) {
      return processCommand(a, b, c, dirOfFile);
    });
    return src;
  }



  function doReplace(src, regex, replacement, dirOfFile, filePath) {
    if (typeof replacement === 'string') {
      return src.replace(regex, replacement);
    }
    if (typeof replacement === 'function') {
      var fileProps = {
        path :filePath,
        dir : dirOfFile
      };
      return src.replace(regex, function () {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(fileProps);
        return replacement.apply(null, args);
      });
    }
    return src;
  }

  function executeReplacements(src, replacements, dirOfFile, filePath) {

    for (var i = 0, len = replacements.length; i < len; i++) {
      var current = replacements[i],
        regex = current.replace,
        replacement = current.using;

      if (isNull(regex)) {
        continue;
      }
      logVerbose('replacing:-----',regex,replacement);
      src = doReplace(src, regex, replacement, dirOfFile, filePath);
    }
    return src;
  }

// Concat source files and/or directives.
  return function (files, options) {
    return files ? files.map(function (filepath) {

      var data = grunt.file.read(filepath),
        dirOfFile = path.dirname(filepath);

      data = findTokens(data, dirOfFile, options.tokenRegex);
      data = executeReplacements(data, options.replacements || [], dirOfFile, filepath);

      //console.log(options.processContent.toString());
      options.processContent && (data = options.processContent(data, filepath));

      return data;

    }).join(grunt.util.normalizelf(options.separator)) : '';
  };
};