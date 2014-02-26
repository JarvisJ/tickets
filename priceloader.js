//           var express = require('express');

var config = require('./config.json');
var url = require('url');
var http = require('http');

//var session3 = require('./sessionthree-02-20-2014-10-24-00-00-00.json');
//var session4 = require('./sessionfour-02-20-2014-10-24-00-00-00.json');
//var session5 = require('./sessionfive-02-20-2014-10-24-00-00-00.json');
//var session6 = require('./sessionsix-02-20-2014-10-24-00-00-00.json');

var Db = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var dbURL = "mongodb://" + config.appSettings.mongolab.DB_USERNAME + ":" + config.appSettings.mongolab.DB_PASS + "@ds030827.mongolab.com:30827/MongoLab-cf";
var numInserts = 0;
var myConn;
function insertCallback(err, docs, countInserts) {
		if(err) {
			console.log("error: " + err);	
			throw err;
		}

}

function insertCallbackFinal(err, docs, countInserts) {
		if(err) {
			console.log("error: " + err);	
			throw err;
		}
		
		numInserts++;

		// close the connection so the program will close
		if(numInserts == config.eventList.length) {
			myConn.close();	
		}			

}


function insertPrices(db,newPrices) {
	var priceCollection = db.collection("histPrices");
	var dDate = newPrices.downloadDate;
	var tickAry = newPrices.priceData.eventTicketListing.eventTicket;
	var eventID = newPrices.priceData.eventTicketListing.event.id;
	priceCollection.findOne({"eventID": eventID}, function (err, item) {
			if(item) {
				var ticketHash = item.ticketHash;
				
				item.dateAry.push(dDate);
				
				console.log("updating item");
				for(var i = 0; i < tickAry.length; i++) {
					if(ticketHash[tickAry[i].id]) {
						ticketHash[tickAry[i].id].push(tickAry[i].tc.amount);
					}
					else {
						//console.log("got new ticket");
						ticketHash[tickAry[i].id] = new Array(item.dateAry.length-1);
						
						ticketHash[tickAry[i].id].push(tickAry[i].tc.amount);
					}
				}
				
				priceCollection.update({"eventID": eventID},
						{"eventID": eventID, "dateAry":item.dateAry, "ticketHash": ticketHash },insertCallbackFinal);				
			}
			else {
				var ticketHash = {};
				for(var i = 0; i < tickAry.length; i++) {
					ticketHash[tickAry[i].id] = [tickAry[i].tc.amount];
				}
				
				priceCollection.insert({"_id" : new ObjectID(), "eventID": eventID, "dateAry":[dDate], "ticketHash": ticketHash },insertCallbackFinal);
			}
			
	});
}

Db.connect(dbURL, function(err, db) {
		var collection = db.collection("rawPriceFiles");
		myConn = db;
		for(var i = 0; i < config.eventList.length; i++ ) {

			var file_url = "http://www.stubhub.com/ticketAPI/restSvc/event/" + config.eventList[i] + "/sort/price/0";		
			var options = {
				 host: url.parse(file_url).host,
				 port: 80,
				 path: url.parse(file_url).pathname
			};

			
			console.log("Getting: " + file_url);
			http.get(options, function(resp) {
				var jsonData = "";
				 resp.on('data', function(data) {
					  jsonData += data;
				 });
				 resp.on('end', function() {
						 try {
							 dat = JSON.parse(jsonData);
							 newRec = {"downloadDate":new Date(),"priceData": dat};
							 collection.insert(newRec, insertCallback);
							 
							 insertPrices(db,newRec);
						 }
						 catch(err) {
							 console.log("JSON parse error: " + err.message);
							 throw err;
						 }
				 });
			})
			.on('error', function(e) {
			  console.log("Got error: " + e.message);
			});
	
		}
		
	  // var collection = db.collection(position);
	 
	 //  var sortKey = position=="pitchers"? ['mSOA',-1] :['mOPS',-1];
	 // collection.find({"$or":[{'LG':'AL'},{'lg':'AL'}]}, {'sort':[['mOPS', -1]]}).toArray(function(err, documents) {
	//	  res.json(documents);
//		  db.close();
	//	  res.end();
	  // });
});	

