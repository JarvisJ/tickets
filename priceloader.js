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
				var doInsertRecord = true ; //dDate-item.dateAry[dateAry.length-1] > hour * 3? true : false;
				item.dateAry.push(dDate);
				item.totalQtAry.push(0);
				
				console.log("updating item");
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
						
				if( doInsertRecord) {
					console.log("inserting record");
				
	
					newRec = {"eventID": eventID, "dateAry":item.dateAry, "totalQtAry": item.totalQtAry, "ticketHash": ticketHash };
					priceCollection.update({"eventID": eventID},
						newRec,insertCallbackFinal);				
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
				priceCollection.insert(newRec,insertCallbackFinal);
			}
			
			if(typeof callback === "function" ) {
				callback(newRec);
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

