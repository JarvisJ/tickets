var express = require('express');
var url = require('url');
var http = require('http');

var app = express.createServer();
app.listen(3000);


app.get('/', function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.sendfile(__dirname + '/index.html');
});

app.get('/ndireport.js', function (req, res) {
  res.sendfile(__dirname + '/ndireport.js');
});

app.get('/curprices/:eventid', function (req, res) {

	var jsonData = "";
   var file_url = "http://www.stubhub.com/ticketAPI/restSvc/event/" + req.params.eventid + "/sort/price/0";		
	var options = {
		 host: url.parse(file_url).host,
		 port: 80,
		 path: url.parse(file_url).pathname
	};
	http.get(options, function(resp) {
		 resp.on('data', function(data) {
			  jsonData += data;
		 });
		 resp.on('end', function() {
		 		 try {
		 		 	 dat = JSON.parse(jsonData);
		 		 	 res.json(dat);
		 		 }
		 		 catch(err) {
		 		 	 console.log("JSON parse error: " + err.message);
		 		 	 res.json(["Error getting pricing data"]);
		 		 }
		 });
	})
	.on('error', function(e) {
	  console.log("Got error: " + e.message);
	});
	

});

app.use(express.static(__dirname + '/public'));


app.get('/baseball.html', function (req, res) {

		
  res.sendfile(__dirname + '/baseball.html');
});


