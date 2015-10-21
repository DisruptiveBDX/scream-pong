'use strict';

require('es6-shim');
var path = require('path');
var express = require('express');
var compression = require('compression');
var app = express();

var PORT = process.env.VIRTUAL_PORT;

app.use(compression());
app.use(express.static('./'));

app.listen(PORT, function () {
    console.log('Server running on', [
        'http://localhost:',
        PORT
    ].join(''));
});
process.on('uncaughtException', function (e) {
    console.error('uncaught', e, e.stack);
    process.exit();
});