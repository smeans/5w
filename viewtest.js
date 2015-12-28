#!/usr/bin/env node

var path = require('path');
var argv = process.argv;

if (argv.length < 3) {
  console.log('usage: ' + path.basename(argv[1]) + ' viewname docurl [docurl]+');
  process.exit(1);
}

var viewname = argv[2];

var fs = require('fs');
var map_code = '(' + fs.readFileSync('./views/' + viewname + '/map.js').toString() + ')(doc)';

var vm = require('vm');

var sandbox = {
  console: console,

  emit: function (key, value) {
    var ra = {id:sandbox.id, key:key, value:value};
    console.log(JSON.stringify(ra));
  }
};

var context = new vm.createContext(sandbox);
var script = new vm.Script(map_code);

var urls = argv.slice(3);
var request = require('request');

function processNextDoc() {
  if (urls.length <= 0) {
    process.exit(0);
  }

  var url = urls.shift();
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      sandbox.id = path.basename(url);
      sandbox.doc = JSON.parse(body);
      console.log('document ' + sandbox.id + ':');
      script.runInContext(context);
      processNextDoc();
    } else {
      console.log(error);
    }
  });
}

processNextDoc();
