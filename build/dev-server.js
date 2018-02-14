#!/usr/bin/env node

var pkg = require('../package')

// Serve development assets - compile jade/stylus on demand
var express = require('express')

var fs = require('fs')
var url = require('url')
var depsBlob = require('./browserify-client-deps')
var router = express.Router()

router.get('/depsblob.js', function(req, res) {
    depsBlob().bundle().pipe(res);
});

router.use(require('serve-static')('./public'));

// Listen
var app = express()
var server = app.listen(15900)

app.use(router)

server.on('listening', function() {
     console.log('Development server listening on: '+server.address().port)
})
