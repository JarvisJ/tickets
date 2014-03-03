var express = require('express');
var url = require('url');
var http = require('http');

var config = require('./config.json');

var Db = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var dbURL = "mongodb://" + config.appSettings.mongolab.DB_USERNAME + ":" + config.appSettings.mongolab.DB_PASS + "@ds030827.mongolab.com:30827/MongoLab-cf";


var app = express.createServer();
app.listen(3000);


app.get('/', function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.sendfile(__dirname + '/index.html');
});

app.get('/ndireport.js', function (req, res) {
  res.sendfile(__dirname + '/ndireport.js');
});

Db.connect(dbURL, function(err, db) {
	app.get('/curprices/:eventid', function (req, res) {
		var inOurEventList = false;
		
		for( var i = 0; i < config.eventList.length; i++ ) {
			//console.log( config.eventList[i]  + " " + req.params.eventid);
			if( config.eventList[i] == req.params.eventid ) {
				inOurEventList = true;
				break;
			}
		}
		
		if( inOurEventList ) {
				
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
							 newRec = {"downloadDate":new Date(),"priceData": dat};
							 
							 Db.connect(dbURL, function(err, db) {
									 
									 myConn = db;
									 
									 try {								 	 
										 insertPrices(db,newRec, function(histDat) {
											// console.log(histDat);
											 var resData = {"event": dat.eventTicketListing.event, "histPrices": histDat,
																 "deliveryTypes": dat.eventTicketListing.deliveryTypes, "eventUrlPath": dat.eventTicketListing.eventUrlPath,
																 "genreUrlPath": dat.eventTicketListing.genreUrlPath};
											 res.json(resData);
										 });
									 }
									 catch( err) {
										console.log(err); 
									 }
										 //console.log("done with insert");
																 
							 });
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
		}	
		else {
			res.json(["Sorry, we are not tracking this event."]);	
		}
	
	});
});
function insertPrices(db,newPrices, callback) {
	var priceCollection = db.collection("histPrices");
	var dDate = newPrices.downloadDate;
	var hour = 1000*60*60;
	var tickAry = newPrices.priceData.eventTicketListing.eventTicket;
	var eventID = newPrices.priceData.eventTicketListing.event.id;
	var newRec = undefined;
		
	priceCollection.findOne({"eventID": eventID}, function (err, item) {
			if(item) {
				var ticketHash = item.ticketHash;
				var doInsertRecord = dDate-item.dateAry[item.dateAry.length-1] > hour * 3? true : false;
				item.dateAry.push(dDate);
				item.totalQtAry.push(0);
				
				for(var i = 0; i < tickAry.length; i++) {
					if(!ticketHash[tickAry[i].id]) {
	
						//console.log("got new ticket");
						ticketHash[tickAry[i].id] = { "pr": new Array(item.dateAry.length-1),
																"qt":  new Array(item.dateAry.length-1),
																"va": tickAry[i].va,
																"vi": tickAry[i].vi,																		
																"rd": tickAry[i].rd,
																"se": tickAry[i].se,	
																"dt": tickAry[i].dt
																};
																					
					}

					ticketHash[tickAry[i].id].pr.push(tickAry[i].tc.amount);
					ticketHash[tickAry[i].id].qt.push(tickAry[i].qt);
					
					if( tickAry[i].qt && !isNaN(tickAry[i].qt) ) { 
						item.totalQtAry[item.totalQtAry.length-1] += tickAry[i].qt;
					}
					
				}	
					
				newRec = {"eventID": eventID, "dateAry":item.dateAry, "totalQtAry": item.totalQtAry, "ticketHash": ticketHash };
						
				if( doInsertRecord) {
					console.log("inserting record");
				
	
					priceCollection.update({"eventID": eventID},
						newRec,insertCallback);				
				}
			}
			else {
				var ticketHash = {};
				var totalQtAry = [0];
				
				for(var i = 0; i < tickAry.length; i++) {
					ticketHash[tickAry[i].id] = { "pr": [tickAry[i].tc.amount],
															"qt": [tickAry[i].qt],
																"va": tickAry[i].va,
																"vi": tickAry[i].vi,																		
																"rd": tickAry[i].rd,
																"se": tickAry[i].se,	
																"dt": tickAry[i].dt
																};
					
					if( tickAry[i].qt && !isNaN(tickAry[i].qt) ) { 
						totalQtAry[0] += tickAry[i].qt;
					}					
				}
				
				console.log("inserting new record");
				newRec =  {"_id" : new ObjectID(),"eventID": eventID, "dateAry":[dDate], "totalQtAry": totalQtAry, "ticketHash": ticketHash };
				priceCollection.insert(newRec,insertCallback);
			}
			
			if(typeof callback === "function" ) {
				callback(newRec);
			}	
	});
}

function insertCallback(err, docs) {
		if(err) {
			console.log("error: " + err);	
			throw err;
		}

}

app.use(express.static(__dirname + '/public'));


app.get('/baseball.html', function (req, res) {

		
  res.sendfile(__dirname + '/baseball.html');
});


