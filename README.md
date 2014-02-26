grunt-ez-frontend
==========

Easy define the css, less files to be parsed, concatenated, autoprefixed and minified, as well as the js files which will be concatenated and minified.

The main task is **ez-frontend** this is a multitask that will make it easy to configure which files will produce which output. Based on the following convention:

a group of less, css files will generate two css outputs, one with the concatenation of the css files and the autoprefixing of the css properties (using grunt-autoprefixer) and other that is the result of applying grunt-csso to the previous output. Also the assets referenced by the stylesheet will be moved to be relative to the location of the output. 

The previous means that a group like the one below:

```javascript
var cssGroup = {
   src : ['path/to/some/less-file.less', 'path/to/other.less', 'path/to/a/css.file.css'],
   dest : 'path/to/some/output/dir/output.css'
}
```
Will generate a file `path/to/some/output/dir/output.css` by first parse the less files and concatenate them with the css files (if any) and then apply autoprefixing to the css properties that require it. Also a file `path/to/some/output/dir/output.min.css` will be created. This a standard practice to add `.min` to a file before the extension to denote that the file is intended to be used in production.

Also a group of js files will generate 2 outputs, one concatenated and preprocessed to include template files as inline strings, and other optimized using **grunt-uglify**. 

The previous means that a group like:

```javascript
var jsGroup = {
   src : ['path/to/some/js-file.js', 'path/to/other.js', 'path/to/a/js.file.js'],
   dest : 'path/to/some/output/dir/output.js'
}
```
Will generate a file `path/to/some/output/dir/output.js` which is going to be the result of the preprocess task and a file `path/to/some/output/dir/output.min.js` that will be the result of applying grunt-uglify to the previous generated file.

This module provide two multi tasks appart from the **ez-frontend** multitask: 

- **preprocess**, a tasks that it is similar to grunt-contrib-concat, but that appart from only concatenate the files, it also allows for some pre-processing and post-processing of the file. It can perform replacement of tokens and include of HTML templates into the javascript to avoid having multiline text on the javascript file and to avoid having to put the templates in the html and then querying from there. **Note**: This is useful when is required to compile the templates on the fly on the browser. If you don't need to compile the templates on the fly maybe it will be better to compile them during the building process. 

- **cLess**, a tiny utility to parse less files, and concatenate them along with regular css files. This utility also move all the assets referenced to a location relative to the generated css file, during this process it also apply revving to the assets, the output path of the assets could be customized to suit different needs.

Getting Started
---------------

Install this grunt plugin next to your project's [Gruntfile.js gruntfile][getting_started] with: `npm install grunt-ez-frontend --save-dev`

Since this module depends on grunt-uglify, grunt-autoprefixer and  grunt-csso, you will need to install them too: Execute `npm install grunt-uglify --save-dev`, 
`npm install grunt-autoprefixer --save-dev`,
`npm install grunt-csso --save-dev`

Then add this line to your project's `grunt.js` gruntfile:

```javascript
grunt.loadNpmTasks("grunt-ez-frontend");
// don't forget to add the other dependencies too
grunt.loadNpmTasks("grunt-uglify");
grunt.loadNpmTasks("grunt-csso");
grunt.loadNpmTasks("grunt-autoprefixer");
```
[npm_registry_page]: http://search.npmjs.org/#/grunt-ez-frontend
[grunt]: https://github.com/cowboy/grunt
[getting_started]: https://github.com/cowboy/grunt/blob/master/docs/getting_started.md

Documentation
-------------
The **ez-frontend** tasks is a [multi task][types_of_tasks], meaning that grunt will automatically iterate over all the targets under this task configuration object

**ez-frontend**
---------------

### Target Properties
*   __src__*(required)*: Depending on the type of output to generate this could be: 
    a. The LESS file(s) to be compiled. Can be either a string or an array of strings. If more than one LESS file is provided, each LESS file will be compiled individually and then concatenated
    together. You can mix regular css files with the less files, they will be just added since they don't need to be parsed. or...

    b. The JS files to be concatenated and compiled.

*   __dest__*(required)*: The path where the output from the LESS compilation or preprocess should be placed. Must be a string as there can be only one destination. The extension of the file is important as this is used to infer the type of the group. You can also specify a type for the group (either `js` or `css`), see the next property:
*   __type__*(optional)*: wheter this group is `js` target or a `css` target. If ommited the type for the group will be infered from the extension of the output file.
*   __options__*(optional)*: An object with the options to pass to the preprocess, uglify in case of a `js` group, and cLess, autoprefix, and csso tasks in case of a `css` group.

### Example

```javascript
// project configuration
grunt.initConfig({
  'ez-frontend': {
    // all the options here could be overridden at a target level
    // or using the the specific options for a particular task
    options: {

      cLessOptions: {},         // options for `cLess` tasks
      autoprefixerOptions: {},  // options for `autoprefixer` tasks
      cssoOptions: {},          // options for `csso` tasks
      preprocessOptions: {},    // options for `preprocess` tasks
      uglifyOptions: {},        // options for `uglify` tasks

      // the banner to be added to the top of the output files. 
      // It will be processed by grunt.template.process
      // so it could use the same format as the meta.banner property.
      banner: bannerContent, 
      
      // called before a less file is parsed
      // it will also receive css files
      // at this stage, the urls of the files were not modified
      // (they are modified to copy the referenced assets to a location
      // relative to the css output file
      beforeParseLess : function (content, filepath) {
        // do some operations here...
        // like generating some less instructions on the fly
        // that are going to be then transformed to css by the less parser
        // if the file was a less one
        return content;
      },
      
      // this imports will be added before the parsed less files
      // this is handy to add custom imports and mixins that you want 
      // to have on all your code
      // Be aware that if you plan to generate several targets 
      // and they don't share the same common files
      // this should be better set on the group level 
      customImports : [ CSS_CODE_DIR + 'common.less', CSS_CODE_DIR + 'font.less' ],

      // Add custom functions to be used as native "less css" functions.
      // 
      // The keys of the object will become the name of the "custom functions" 
      // 
      // The functions will be added to the less.tree.functions object
      // 
      // When called the function will receive the less object as the first parameter
      // and whatever other values were passed to the function from the less usage
      //
      // Example:
      // 
      // Using the 'em-calc' function in the less file
      //
      // font-size : em-calc(16px);
      //
      // will result in 
      // 
      // font-size : 1em /* em-calc output*/;
      //  
      // 
      userFunctions : {
        'em-calc' : function (unit /* is a less object that wraps the unit */) {
          var number = unit.value;
          if (!isNaN(number)) {
            return lib.format('{0}em /* em-calc output*/', number / 16);
          }
          throw new Error("em-calc expects a number!");
        }
      },
      
      // the this context object for the userFunctions, if not specified or null
      // the less object will be used
      userFunctionsThisObj : null,

      // if provided the filenames will be modified to use this 
      // as part of the file name, just before the extension.
      // For example : 
      // 
      // instead of 'path/to/some/output.css' it will be 
      // 'path/to/some/output.{version}.css' where {version} will be
      // replaced with the assetsVersion given.
      // 
      // Same will happen with the minified version in that case:
      // 
      // instead of 'path/to/some/output.min.css' it will be 
      // 'path/to/some/output.{version}.min.css' where {version} will be
      // replaced with the assetsVersion given.
      // 
      // also assets referenced by less files will be moved into a folder
      // with the version as the name. Please note this behavior could 
      // be overriden by setting a different rewritePathTemplate option
      assetsVersion : assetsVersion, 
      
      // this controls the format of the rewriten url for the assets
      // referenced in the less/css files. 
      // {0} will be replaced by the assetsVersion
      // {1} will be replaced by the md5 of the referenced url
      // {2} will be the original name of the asset
      // Another template could be 
      //   'assets/{1}_{2}'
      // In this case we're not using the assetsVersion 
      rewritePathTemplate : 'assets/{0}/{1}/{2}',

      // runs per each file (css, less or js file)
      // this hook allows to modify the content of the file being parsed
      // this will run for preprocess and cLess tasks. 
      // 
      // If this function is intended to run only for a particular group (css or js)
      // It will be better to use the options object of the target 
      // instead of this global hook.
      processContent: function(content, filePath) { 
        return content;
      },
      
      // runs after preprocess or cLess tasks are finished and are about 
      // to save the output to a disk.
      // This hook could be used to further modify the output if necessary.
      // 
      // If this function is intended to run only for a particular group (css or js)
      // It will be better to use the options object of the target 
      // instead of this global hook.
      postProcess: function(content, filePath) { 
        return content;
      }, 
      
      // this option is for the autoprefixer see grunt-autoprefixer for more info visit https://github.com/nDmitry/grunt-autoprefixer
      browsers: ['last 2 version', 'ie 8', 'ie 7'], 
      
      // this option will be passed to the preprocess task
      replacements : [{
        replace : /\[APP_VERSION\]/g,
        using : function () {
          return pkg.version;
        }, {
          replace : /\[AUTOR]/g,
          using : 'Roy Riojas'
        }
      }]
    },
    'app-js': {
      
      // This group will generate the files dist/main.js and dist/main.min.js 
      // also the files will be preprocess to replace some sections
      // with a comment that will be later be removed by uglify 
      // in this case the section to be replaced is a block of code only required
      // for user testing
      src: ['main.js', 'views/**/*.js'],
      dest: 'dist/main.js',
      options: {
        replacements: [{
          //remove code that is only for testing purposes and which is inside the editor-fold region
          replace: /\/\/<editor-fold desc="test-region">[\s\S.]*\/\/<\/editor-fold>/, 
          // could be a string or a function that returns a string
          using: '//CODE FOR TESTING REMOVED' 
        }]
      }
    },
    'app-css': {
      // This group will generate the main.css file and will replace
      // em-calc(number) with the em-value resulting of dividing the number by 16.
      // This could be used to create custom functions on the css
      src: ['main.less', 'other.css'],
      dest: 'dist/main.css',
      options: {
        // overrides the specified in the global options for the ez-frontend multitask
        postProcess: function(content) { 
          var regexEmCalc = /\bem-calc\((.*)\)/g;

          content = content.replace(regexEmCalc, function(a, b) {
            var number = parseFloat(b);
            if (!isNaN(number)) {
              return lib.format('{0}em', number / 16);
            }
            throw new Error("em-calc expects a number!");
          });

          return content;
        }
      }
    }
  }
})

```



[types_of_tasks]: https://github.com/cowboy/grunt/blob/master/docs/types_of_tasks.md


Release History
---------------

*   __02/26/2014 - 0.2.16__:
      - Added a way to send specific options per task.
        - `cLessOptions`: options for `cLess` tasks
        - `autoprefixerOptions`: options for `autoprefixer` tasks
        - `cssoOptions`: options for `csso` tasks
        - `preprocessOptions`: options for `preprocess` tasks
        - `uglifyOptions`: options for `uglify` tasks

      - Added two helper tasks to run css-targets and js-targets
        - **css-target**. Executes ez-frontend and cLess autoprefixer and csso for a given ez-frontend entry.
          To use it simply run `grunt css-target:nameOfTarget' and the ez-frontend task will be executed, then the
          tasks `cLess:nameOfTarget`, `autoprefixer:nameOfTarget` and `csso:nameOfTarget` task are executed too
        - **js-target**. Executes `ez-frontend` and `preprocess` and `uglify` for a given `ez-frontend` entry.
          To use it simply run `grunt js-target:nameOfTarget' and the ez-frontend task will be executed and then
          the `preprocess:nameOfTarget` and the `uglify:nameOfTarget` will be executed.


*   __02/18/2014 - 0.2.15__:
      - Added single task `test` to run generated qunit tests in isolation
      ````
      // syntax
      // grunt test:nameOfTask

      // will only execute the tests for coalesce instead of running all the defined tasks
      grunt test:coalesce

      ````
      - Custom user functions for less added. calc-em, calc-rem, rel-val. To use them just do:
      `````
      // syntax
      //
      // calc-rem(valueInPx[, baseFontSize]): return value in 'rems'
      // calc-em(valueInPx[, baseFontSize]): return value in 'ems'
      // rel-val(valueInPx[, relativeDimension]): return value relative to the relativeDimension passed in percentage

      // Examples

      font-size: calc-em(15px) // will output font-size: 1em (the default base font is 15px by default)
      font-size: calc-em(12px, 16) // will output font-size: 0.75em

      font-size: calc-rem(15px) // will output font-size: 1rem (the default base font is 15px by default)
      font-size: calc-rem(12px, 16) // will output font-size: 0.75rem

      width: rel-val(500, 1000) // will output width: 50%;

      `````
*   __02/16/2014 - 0.2.14__:
    - Added a task to generate `grunt-qunit-istanbul` targets on the fly. It requires you have installed grunt-qunit-instanbul from this [fork][grunt-qunit-istanbul] in order to prevent this [bug][qunit-istanbul-bug]

    **IMPORTANT**: For this task to work, your qunit tests should be located inside folders with different unique names, since the
    name of the test is inferred from the name of the folder that contain the test. Also add the attribute `data-cover` to the
    scripts you want to get coverage from. This task will get the list of files where the data-cover attribute was present and
    create a target for `grunt-qunit-istanbul`

    The task could be used by adding the following task configuration in your grunt config

    ````
    'test-targets-generator': {
      options: {
        '--web-security': 'no',
        coverage: {
          instrumentedFiles: 'temp/',
          reportFolder: 'report/', //where to store the reports. A folder with the name of the target will be created inside
          linesThresholdPct: 85,
          statementsThresholdPct: 85,
          functionsThresholdPct: 85,
          branchesThresholdPct: 85
        }
      },
      all: {
        files: [ {
          src: [ 'tests/**/*.html' ],
          expand: true
        } ]
      }
    }
    ````
    Then simply you can type this in your command line to execute the qunit targets created.

    ````
    grunt test-targets-generator qunit
    ````

*   __02/10/2014 - 0.2.13__:
    - Added logs while templates are created.

*   __02/10/2014 - 0.2.12__:
    - Bug fix. Fixed default template to create compiled templates. 
      The token to be replace was [CONTENT] and it was supposed to be [[CONTENT]].

*   __02/05/2014 - 0.2.10__:
    - Bug fix. Added Fix to cLess to avoid corrupting font or other binary files while copying them to the assets location. [Read more][grunt_contrib_copy_issue]

*   __01/19/2014 - 0.2.9__:
    - Bug fix. Banner were ignored in css outputs

*   __01/10/2014 - 0.2.8__:
    - Added generic regular expressions replacements to the gruntTaskUtil.beautifier helper object. TODO: this will be moved to grunt-jsbeautifier
      After beautification the following replacements are made:
```javascript
    replacements : [{
        replace : /!!\s/g, // double bang with one space after
        using : '!!' // removes the extra space at the end leaving only the double bang.
      }, {
        replace : /\(\sfunction/g, // extra space in anonymous functions passed as arguments
        using : '(function' // removes the extra space
      }, {
        replace : /\)\s\)/g,  // closing parenthesis with an space in the middle
        using : '))' // remove the middle space
      }]
```
*   __12/16/2013 - 0.2.7__:
    - Bug Fix. Make the i18n-2-ez-frontend task to work as expected

*   __12/16/2013 - 0.2.6__:
    - Added helper functions onBeautified and onVerificationFailed.

*   __12/16/2013 - 0.2.5__:
    - Added bannerFile property to ez-frontend. When especified the banner property is replaced by the contents of the file mentioned by bannerFile

*   __12/16/2013 - 0.2.4__:
    - Renamed fileTemplate property of compile-templates task to template property, also added a property to read the fileTemplate from a file in the filesystem.

*   __12/16/2013 - 0.2.3__:
    - Expose some utilities as multitasks 'validate-templates', 'compile-templates', 'i18n-from-yml' and 'i18n-to-ez-frontend' also expose the gruntTaskUtil.registerTasks to pass an object with tasks that can be registered with grunt in a DRY way

*   __10/28/2013 - 0.2.2__: 
    - Add log message to cLess and preprocess tasks.

*   __10/28/2013 - 0.2.1__: 
    - Fix issue with new version of Less. Now using fixed semvers for dependencies.

*   __09/27/2013 - 0.1.8__: 
    - Make custom functions to work when assigned to variables.

*   __09/25/2013 - 0.1.7__: 
    - Added a customImports option to the cLess task to allow easy import of mixins and common files. options.customImports.

*   __09/25/2013 - 0.1.6__: 
    - Added support for userFunctions in less.
    - Added the current filename being processed for easier debugging of less errors.
    - Added a pre parse callback for less files options.beforeParseLess.
                          
*   __09/21/2013 - 0.1.4__: Initial release.

License
-------

Copyright (c) 2013 Roy Riojas
This module is based on the grunt-r3m module. Basically it has been rewritten to support the features I needed.

Licensed under the MIT license.

[grunt_contrib_copy_issue]: http://royriojas.wordpress.com/2014/02/06/grunt-copy-corrupting-binary-files/
[grunt-contrib-istanbul]: http://github.com/royriojas/grunt-qunit-istanbul
[qunit-istanbul-bug]:https://github.com/asciidisco/grunt-qunit-istanbul/issues/10
