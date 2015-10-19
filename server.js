"use strict";

require('es6-shim');
var fs = require("fs");
var path    = require('path');
var express   = require('express');
var app     = express();
var server  = require('http').createServer(app);
var io = require('socket.io')(server);
var ss = require('simple-statistics');

var quantile = ss.quantile;

var SPI = require('pi-spi');
var spi = SPI.initialize("/dev/spidev0.0");

// Read value from a MCP3002 (http://ww1.microchip.com/downloads/en/DeviceDoc/21294C.pdf)
function readMCP(channel) {
    return new Promise(function(resolve, reject){
        if (spi === undefined) return;
        var mode = (8 + channel) << 4;
        var tx = new Buffer([1, mode, 0]);
        var rx = new Buffer([0, 0, 0]);

        spi.transfer(tx, tx.length, function(err, buffer) {
            if(err) return reject(err);
            var value = ((buffer[1] & 3) << 8) + buffer[2];
            resolve(value);
        });
    });
}


function measure(during){
    var startMillis = Date.now();

    var measurePs = [];

    while (Date.now() - startMillis < during){

      measurePs.push(readMCP(0))

    }

    return Promise.all(measurePs).then(function(measures){
      var max = quantile(measures, 0.8);
      var min = quantile(measures, 0.2);

      measures.sort(function(a,b){return a-b});

      var peakToPeak = max - min;
      return peakToPeak;
    })
};


function measureLoop(during){
  return measure(during)
    .then(function(ptp){
      console.log(ptp)
      io.emit('data', ptp);
    })
    .then(function(){
      return measureLoop(during)
    });

}
measureLoop(50);




var PORT = 8000;

app.use("/images",   express.static(path.join(__dirname, '/images')));
app.use("/sounds",   express.static(path.join(__dirname, '/sounds')));
app.use("/pong.css",   express.static(path.join(__dirname, '/pong.css')));

app.get('/game.js', function(req, res){
  res.sendFile(__dirname + '/game.js');
});

app.get('/pong.js', function(req, res){
  res.sendFile(__dirname + '/pong.js');
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});



io.on('connection', function(socket){
  console.log('a user connected');
});


server.listen(PORT, function () {
    console.log('Server running on', [
        'http://localhost:',
        PORT
    ].join(''));
});

