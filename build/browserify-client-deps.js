#!/usr/bin/env node

var browserify = require('browserify')
var fs = require('fs')
var babelify = require('babelify')
var Readable = require('stream').Readable
var pkg = require('../package')

// NOTE: should we replace this by webpack?

module.exports = function() {
	var opts = { 
		insertGlobalVars: true,
		basedir: process.cwd(),
		builtins: [
			'_process', 
			'util', 'buffer', 'url', 
			'punycode', // ??
			'querystring', 'os', 'path', 
			'crypto',
			'stream', 'events', 'string_decoder', 'assert'

		] 
	}

	var b = browserify([ ], opts);


	// basic list, we'll extend it when reading resources.jade
	// cat src/resources.pug | grep script | grep node_modules | cut -d '/' -f2 | while read line; do echo "'$line': 1,"; done | sort | uniq
	var ignoreList = {
		'aero': 1,
	}
	

	var pkgFile = new Readable();
	// displayName, version, name, website is all we need; hash is needed only when compiling the HTML
	pkgFile.push('module.exports = '+JSON.stringify({ displayName: pkg.displayName, name: pkg.name, version: pkg.version, website: pkg.website }));
	pkgFile.push(null);
	b.require(pkgFile, { expose: './package' });

	b.require('babel-polyfill');
 	
 	// Do we need those?
	b.require('url');
	b.require('os');
	b.require('crypto');
	b.require('path');
	b.require('querystring');
	b.require('buffer');

	for (dep in require('../package').dependencies) {
		if (!ignoreList[dep]) { 
			//console.log('including '+dep)
			b.require(dep);

		}
	}

	return b.transform(babelify, { presets: ['latest'], plugins: ['transform-runtime']})
}
