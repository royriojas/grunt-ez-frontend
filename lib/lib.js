/*
 jQuery.extend extracted from the jQuery source & optimised for NodeJS
 Twitter: @FGRibreau / fgribreau.com

 Usage:
 var Extend = require('./Extend');


 // Extend
 var obj = Extend({opt1:true, opt2:true}, {opt1:false});

 // Deep Copy
 var clonedObject = Extend(true, {}, myObject);
 var clonedArray = Extend(true, [], ['a',['b','c',['d']]]);
 */

'use strict';

var toString = Object.prototype.toString,
  hasOwn = Object.prototype.hasOwnProperty,
  push = Array.prototype.push,
  slice = Array.prototype.slice,
  trim = String.prototype.trim,
  indexOf = Array.prototype.indexOf,
  crypto = require('crypto'),

// [[Class]] -> type pairs
  class2type = {};

// Populate the class2type map
"Boolean Number String Function Array Date RegExp Object".split(" ").forEach(function(name) {
  class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

function type(obj){
  return obj === null ?
    String( obj ) :
    class2type[ toString.call(obj) ] || "object";
}

function isPlainObject( obj ) {
  if ( !obj || type(obj) !== "object") {
    return false;
  }

  // Not own constructor property must be Object
  if ( obj.constructor &&
    !hasOwn.call(obj, "constructor") &&
    !hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
    return false;
  }

  // Own properties are enumerated firstly, so to speed up,
  // if last one is own, then all properties are own.

  var key;
  for ( key in obj ) {}

  return key === undefined || hasOwn.call( obj, key );
}
var lib = {
  md5 : function(str, encoding){
  return crypto
    .createHash('md5')
    .update(str)
    .digest(encoding || 'hex');
  },

  addNoCache : function (url) {
    var trim = lib.trim;
    url = trim(url);
    var parts1, parts2, oldVars, newVars = [];
    parts1 = url.split('#');
    parts2 = parts1[0].split('?');
    if (parts2.length > 1 && trim(parts2[1]) !== '') {
      oldVars = parts2[1].split('&');
      newVars = oldVars.filter(function (ele) {
        var nc = ele.indexOf('nocache=') > -1;
        return !nc;
      });
    }

    newVars.push('nocache=' + lib.now());

    parts2[1] = newVars.join('&');
    parts1[0] = parts2.join('?');

    return parts1.join('#');
  },

  iterate : function(items, fn, cb) {
    var len = items.length;
    var current = 0;

    //closure function to iterate over the items async
    var process = function(lastValue) {
      //var currentItem
      if (current === len) {
        cb && cb(lastValue);
        return;
      }
      var item = items[current++];
      setTimeout(function() {
        fn(item, function(val) {
          process(val && lastValue);
        });
      }, 20);
    };
    process(true);
  },

  trim : function (s) {
    if (!s) {
      return '';
    }
    return s.replace(/^\s*(\S*(?:\s+\S+)*)\s*$/, "$1");
  },

  now : function () {
    var fn = Date.now;
    if (fn) {
      return Date.now();
    }
    return (new Date()).getTime();
  },
  /**
   * return a string formatted with the passed arguments
   * @example
   *
   * var s = $a.format('Some {0} with a {1} mood {2}', 'String', 'good', 'arrived');
   * //output
   * //s = 'Some String with a good mood arrived'
   */
  format : function () {
    var pattern = /\{(\d+)\}/g;
    //safer way to convert a pseudo array to an object array
    var args = Array.prototype.slice.call(arguments);
    var s = args.shift();
    return s.replace(pattern, function(c, d) {
      var replacement = args[d] ;
      if (lib.isNull(replacement)) {
        replacement = "";
      }
      return replacement;
    });
  },
  /**
   * given an object and a key (in a string format separated by dots) return the object value
   */
  getValue : function (obj, key) {
    var tokens = key.replace(/\{|\}/g, '').split(".") || [],
      currVal = obj || {};
    for (var ix = 0, len = tokens.length; ix < len; ix++) {
      if ((typeof currVal === 'undefined') || (currVal === null)) {
        break;
      }
      var currentToken = tokens[ix];
      currVal = currVal[currentToken];
    }
    return currVal;
  },
  /**
   * debounce returns a new function than when called will
   * execute the function and prevent any other calls to be executed
   * if they happen inside the threshold
   *
   * This is useful to execute just the first call of a series of calls inside a
   * threshold
   *
   * @param {Function} f      the function to debounce
   * @param {Integer} ms      the number of miliseconds to wait. If any other call
   *                          is made before that theshold it will be discarded.
   * @param {Object} ctx      the context on which this function will be executed
   *                          (the this object inside the function wil be set to this context)
   */
  debounce: function(f, ms, ctx){
    //just return the wrapper function
    return function(){
      //if this is the first time of the sequence of calls to this function
      if (f.timer == null) {
        //store the original arguments used to call this function
        var args = arguments;
        //execute it inmediately
        (function(){
          //call the function with the ctx and the original arguments
          f.apply(ctx, args);
          //set the timer
          f.timer = setTimeout(function(){
            //to make sure the next set of calls will be executing the first call as soon as possible
            f.timer = null;
          }, ms || 1);
        })();
      }
    };
  },
  /**
   * throttle returns a new function than when called will cancel any previous not executed
   * call reseting the timer again for a new period of time.
   *
   * This is usfeful to execute only the last call of a series of call within a time interval
   *
   * @param {Object} f
   * @param {Object} ms
   * @param {Object} ctx
   */
  throttle: function(f, ms, ctx){
    return function(){
      var args = arguments;
      clearTimeout(f.timer);
      f.timer = setTimeout(function(){
        f.timer = null;
        f.apply(ctx, args);
      }, ms || 0);
    };
  },
  /**
   * define a namespace object
   * @param {Object} ns
   */
  ns: function(ns, root){
    if (!ns) {
      return null;
    }
    var nsParts = ns.split(".");
    root = root || this;
    for (var i = 0, len = nsParts.length; i < len; i++) {
      if (typeof root[nsParts[i]] === "undefined") {
        root[nsParts[i]] = {};
      }
      root = root[nsParts[i]];
    }
    return root;
  },
  isNull : function (val) {
    return typeof val === "undefined" || val === null;
  },
  /**
   * return a random number between a min and a max value
   */
  rand : function() {
    var min, max, args = arguments;
    //if only one argument is provided we are expecting to have a value between 0 and max
    if (args.length === 1) {
      max = args[0];
      min = 0;
    }
    //two arguments provided mean we are expecting to have a number between min and max
    if (args.length >= 2) {
      min = args[0];
      max = args[1];

      if (min > max) {
        min = args[1];
        max = args[0];
      }
    }
    return min + Math.floor(Math.random() * (max - min));
  },
  extend : function(){
    var options, name, src, copy, copyIsArray, clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false;

    // Handle a deep copy situation
    if ( typeof target === "boolean" ) {
      deep = target;
      target = arguments[1] || {};
      // skip the boolean and the target
      i = 2;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if ( typeof target !== "object" && type(target) !== "function") {
      target = {};
    }

    // extend jQuery itself if only one argument is passed
    if ( length === i ) {
      target = this;
      --i;
    }

    for ( ; i < length; i++ ) {
      // Only deal with non-null/undefined values
      if ( (options = arguments[ i ]) != null ) {
        // Extend the base object
        for ( name in options ) {
          src = target[ name ];
          copy = options[ name ];

          // Prevent never-ending loop
          if ( target === copy ) {
            continue;
          }

          // Recurse if we're merging plain objects or arrays
          if ( deep && copy && ( isPlainObject(copy) || (copyIsArray = type(copy) === "array") ) ) {
            if ( copyIsArray ) {
              copyIsArray = false;
              clone = src && type(src) === "array" ? src : [];

            } else {
              clone = src && isPlainObject(src) ? src : {};
            }

            // Never move original objects, clone them
            target[ name ] = lib.extend( deep, clone, copy );

            // Don't bring in undefined values
          } else if ( copy !== undefined ) {
            target[ name ] = copy;
          }
        }
      }
    }

    // Return the modified object
    return target;
  }
};
module.exports = lib;