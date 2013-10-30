# grunt-retire v0.1.0

> Grunt task for retire. Scanner detecting the use of JavaScript libraries with known vulnerabilites.



## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-retire --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-retire');
```




## Retire task
_Run this task with the `grunt retire` command._

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.
### Available options
Example configuration below shows default option values and the correct syntax to use if you want to override any of them. If no options are provided, the default values as shown below are used.

```js
    retire: {
      files: ['app/src/*.js'], /** Which js-files to scan. **/
      options: {
         verbose: true,
         packageOnly: true, /* Note! package:false is not yet implemented in grunt plugin, only in node version of retire. */
         nodeOnly: false,
         jsOnly: false,
         jsRepository: 'https://raw.github.com/bekk/retire.js/master/repository/jsrepository.json',
         nodeRepository: 'https://raw.github.com/bekk/retire.js/master/repository/npmrepository.json'
      }
    }
```

`verbose: true/false`, default is `true`. More verbose output (grunt -d may also be used for even more debug output).
`packageOnly: true/false`, default is `true`. Only scan only dependencies in package.json, skip dependencies to dependencies.
`nodeOnly`: true/false`, default is `false`. Only scan Node dependencies in package.json, skip Javascript-file scanning.
`jsOnly`: true/false`, default is `false`. Only scan Javascript-files, skip Node dependencies in package.json.
`jsRepository: String`, default is `https://raw.github.com/bekk/retire.js/master/repository/jsrepository.json`. JSON file which specifies where to retrieve Javascript vulnerability database.
`nodeRepository: String`, default is `https://raw.github.com/bekk/retire.js/master/repository/npmrepository.json`. JSON file which specifies where to retrieve Node vulnerability database.


This task primarily delegates to [Retire][], so please consider the [Retire documentation][] as required reading for advanced configuration.

[Retire]: https://github.com/bekk/retire.js
[Retire documentation]: https://github.com/bekk/retire.js

## Scan node dependencies example
```js
    retire: {
      options: {
         nodeOnly: true,
      }
    }
```
Running ```grunt retire``` will all dependencies specified under `dependencies` in `package.json`.


## Scan javascript files only
```js
    retire: {
      files: ['app/src/*'], /** Scan js-files in app/src/ directory. **/
      options: {
        jsOnly: true
      }
    }
```

Running ```grunt retire``` will scan files in app/src/ for vulnerabilities.


## Example output with one vulnerability found in jquery-1.6.js:

```
➜  grunt-retire git:(master) ✗ grunt retire
Running "retire:jsPath" (retire) task
JS repository loaded from: https://raw.github.com/bekk/retire.js/master/repository/jsrepository.json
>> test-files/jquery-1.6.js
>> ↳ jquery 1.6 has known vulnerabilities: http://web.nvd.nist.gov/view/vuln/detail?vulnId=CVE-2011-4969
Node repository loaded from: https://raw.github.com/bekk/retire.js/master/repository/npmrepository.json
```



## Example output when no vulnerabilities is found
```
➜  grunt-retire git:(master) ✗ grunt retire
Running "retire:jsPath" (retire) task
JS repository loaded from: https://raw.github.com/bekk/retire.js/master/repository/jsrepository.json
Node repository loaded from: https://raw.github.com/bekk/retire.js/master/repository/npmrepository.json
No vulnerabilities found.

Done, without errors.
```


## Release History

 * 2013-10-30   v0.1.0   First version.
