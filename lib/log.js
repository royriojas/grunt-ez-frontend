module.exports = function (grunt) {
  'use strict';
  var verbose = grunt.verbose;
  return {
    logVerbose:function (msg) {
      verbose.writeln('\n\n====================');
      verbose.writeln(msg);
      verbose.writeln('====================\n\n');
    }
  };
};