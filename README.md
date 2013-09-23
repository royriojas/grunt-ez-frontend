grunt-ez-frontend
==========

Easy define the css, less files to be parsed, concatenated, autoprefixed and minified, as well as the js files which will be concatenated and minified.

The main task is **ez-frontend** this is a multitask that will make it easy to configure which files will produce which output. Based on the following convention:

a group of less, css files will generate two css outputs, one with the concatenation of the css files and the autoprefixing of the css properties (using grunt-autoprefixer) and other that is the result of applying grunt-csso to the previous output. Also the assets referenced by the stylesheet will be moved to be relative to the location of the output. 

The previous means that a group like the one below:

```javascript
var cssGroup = {
   src : [path/to/some/less-file.less, path/to/other.less, path/to/a/css.file.css],
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

### Target Properties
*   __src__*(required)*: Depending on the type of output to generate this could be: 
- The LESS file(s) to be compiled. Can be either a string or an array of strings. If more than one LESS file is provided, each LESS file will be compiled individually and then concatenated together. You can mix regular css files with the less files, they will be just added since they don't need to be parsed. or...
- The JS files to be concatenated and compiled.

*   __dest__*(required)*: The path where the output from the LESS compilation or preprocess should be placed. Must be a string as there can be only one destination. The extension of the file is important as this is used to infer the type of the group. You can also specify a type for the group (either `js` or `css`), see the next property:
*   __type__*(optional)*: wheter this group is `js` target or a `css` target. If ommited the type for the group will be infered from the extension of the output file.
*   __options__*(optional)*: An object with the options to pass to the preprocess, uglify in case of a `js` group, and cLess, autoprefix, and csso tasks in case of a `css` group.

### Example

```javascript
// project configuration
grunt.initConfig({
   'ez-frontend' : {
      options : {
        banner : bannerContent, // the banner to be added before the output files
        //assetsVersion : assetsVersion, //if provided the filenames will be modified to use this as part of the file name, just before the extension.
        processContent : function (content, filePath) { // runs per each file (css, less or js file)
          //console.log('::::: processContent ::::: ' + filePath);
          return content;
        },
        postProcess : function (content, filePath) { // runs per each output
          return content;
        }
        // these options could be overridden on a target level.
      },
      'app-js' : {
        src : ['main.js', 'views/**/*.js'],
        dest : 'dist/main.js', 
        options : {
            replacements : [{
               replace : /\/\/<editor-fold desc="test-region">[\s\S.]*\/\/<\/editor-fold>/, //remove code that is only for testing purposes and which is inside the editor-fold region
               using : '//CODE FOR TESTING REMOVED' // could be a string or a function that returns a string
      }]
        }
      }, 
      'app-css' :{
        src : ['main.less', 'other.css'],
        dest :'dist/main.css',
        options : {
           browsers : ['last 2 version', 'ie 8', 'ie 7'], //this option is for the autoprefixer see grunt-autoprefixer for more info visit https://github.com/nDmitry/grunt-autoprefixer
          postProcess : function (content) { // overrides the specified in the global options for the ez-frontend multitask
            var regexEmCalc = /\bem-calc\((.*)\)/g;

            content = content.replace(regexEmCalc, function (a, b) {
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

Contributing
------------

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt][grunt].


Release History
---------------
*   __04/04/2012 - 0.1.4__: Initial release.

License
-------

Copyright (c) 2012 Roy Riojas
This module is based on the grunt-r3m module. Basically it has been rewritten to support the features I needed.

Licensed under the MIT license.

