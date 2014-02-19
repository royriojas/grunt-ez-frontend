'use strict';

var lib = require('./lib.js');

module.exports = {
  /**
   * **calc-em** Calculate the "em" value from the given value in pixels. If a base is passed it will
   * be assumed to be the font size of the parent container which the calculated "em value" will be relative to
   *
   * @param {Object} valPx less object with a value property which holds the numeric value. This is the current
   value of the font in px
   * @param {Object} basePx less object with a value property which holds the numeric value. This is the size
   of the font of the parent container in px. If not specified 15 will be used by default

   * @return {String} a string.
   */
  'calc-em': function ( valPx /* is a less parsed value */ , basePx ) {
    basePx = basePx || {};

    var number = valPx.value,
      base = basePx.value || 15;

    if ( !isNaN( number )) {
      return lib.format( '{0}em /* em-calc output */', number / base );
    }

    throw new Error( "em-calc expects a number!" );
  },
  /**
   * Calculate the "rem" value from the given value in pixels. If a base is passed it will be assumed to be
   * the font size of the parent container which the calculated "rem value" will be relative to
   *
   * @method calc-rem
   * @param {Object} valPx less object with a value property which holds the numeric value.
   *        This is the current value of the font in px
   * @param {Object} basePx less object with a value property which holds the numeric value.
   *        This is the size of the font of the parent container in px. If not specified 15
   *        will be used by default
   * @return {String} a string.
   */
  'calc-rem': function ( valPx /* is a less parsed value */ , basePx ) {
    basePx = basePx || {};

    var number = valPx.value,
      base = basePx.value || 15;

    if ( !isNaN( number )) {
      return lib.format( '{0}rem /* rem-calc output */', number / base );
    }

    throw new Error( "rem-calc expects a number!" );
  },

  /**
   * Calculate the percentage value from the given value in pixels relative to the "relativeDimension" passed
   *
   * @method rel-val
   * @param {Object} valPx less object with a value property which holds the numeric value.
   *        This is the value of the dimension in pixels
   * @param {Object} relativeDimension less object with a value property which holds the numeric value.
   *        This is the value of the relative dimension (usually the parent element dimension, width or height)
   * @return {String}
   */
  'rel-val': function ( valPx, relativeDimension ) {
    return lib.format( '{0}% /* relative-value output*/', valPx.value / relativeDimension.value * 100 );
  }
};