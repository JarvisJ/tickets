//           var express = require('express');

var config = require('./config.json');

var session1 = require('./sessionone-02-20-2014-10-24-00-00-00.json');
var session2 = require('./sessiontwo-02-20-2014-10-24-00-00-00.json');
var session3 = require('./sessionthree-02-20-2014-10-24-00-00-00.json');
var session4 = require('./sessionfour-02-20-2014-10-24-00-00-00.json');
var session5 = require('./sessionfive-02-20-2014-10-24-00-00-00.json');
var session6 = require('./sessionsix-02-20-2014-10-24-00-00-00.json');

var Db = require('mongodb').MongoClient;

var dbURL = "mongodb://" + config.appSettings.mongolab.DB_USERNAME + ":" + config.appSettings.mongolab.DB_PASS + "@ds030827.mongolab.com:30827/MongoLab-cf";


var ObjectID = require('mongodb').ObjectID;

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
		if(numInserts == 6) {
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
			myConn = db;
			
			var collection = db.collection("rawPriceFiles");
	
			var newRec = {"downloadDate":new Date(2014, 2, 20, 10, 24, 0, 0),"priceData": session1};
			//collection.insert(newRec, insertCallback);				 
			insertPrices(db,newRec);

			var newRec = {"downloadDate":new Date(2014, 2, 20, 10, 24, 0, 0),"priceData": session2};
			//collection.insert(newRec, insertCallback);				 
			insertPrices(db,newRec);
			
			var newRec = {"downloadDate":new Date(2014, 2, 20, 10, 24, 0, 0),"priceData": session3};
			//collection.insert(newRec, insertCallback);				 
			insertPrices(db,newRec);
			
			var newRec = {"downloadDate":new Date(2014, 2, 20, 10, 24, 0, 0),"priceData": session4};
			//collection.insert(newRec, insertCallback);				 
			insertPrices(db,newRec);
			
			var newRec = {"downloadDate":new Date(2014, 2, 20, 10, 24, 0, 0),"priceData": session5};
			//collection.insert(newRec, insertCallback);				 
			insertPrices(db,newRec);
			
			var newRec = {"downloadDate":new Date(2014, 2, 20, 10, 24, 0, 0),"priceData": session6};
			//collection.insert(newRec, insertCallback);				 
			insertPrices(db,newRec);
/* 			
			collection.insert({"downloadDate":new Date(2014, 2, 20, 10, 24, 0, 0),"priceData": session3}, function(err,documents) {
					if(err) {
						console.log("error: " + err);	
					}
					

			});
			
			collection.insert({"downloadDate":new Date(2014, 2, 20, 10, 24, 0, 0),"priceData": session4}, function(err,documents) {
					if(err) {
						console.log("error: " + err);	
					}
			});

			collection.insert({"downloadDate":new Date(2014, 2, 20, 10, 24, 0, 0),"priceData": session5}, function(err,documents) {
					if(err) {
						console.log("error: " + err);	
					}
			});
		
			collection.insert({"downloadDate":new Date(2014, 2, 20, 10, 24, 0, 0),"priceData": session6}, function(err,documents) {
					if(err) {
						console.log("error: " + err);	
					}
					
					db.close();
			}); */			
			
		  // var collection = db.collection(position);
		 
 		 //  var sortKey = position=="pitchers"? ['mSOA',-1] :['mOPS',-1];
		 // collection.find({"$or":[{'LG':'AL'},{'lg':'AL'}]}, {'sort':[['mOPS', -1]]}).toArray(function(err, documents) {
		//	  res.json(documents);
	//		  db.close();
		//	  res.end();
        // });
	});	

