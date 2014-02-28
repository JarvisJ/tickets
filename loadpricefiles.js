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
		if(numInserts == 12) {
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


function processRawPriceFiles(db) {
	var rawPriceFiles = db.collection("rawPriceFiles");

	rawPriceFiles.find({_id: { $in: [ new ObjectID("530d57fcbbfc4ab014cddfc1"),new ObjectID("530d57fcbbfc4ab014cddfc2"),
												 new ObjectID("530d57fcbbfc4ab014cddfc3"),new ObjectID("530d57fcbbfc4ab014cddfc4"),
												 new ObjectID("530d57fdbbfc4ab014cddfc5"),new ObjectID("530d57fdbbfc4ab014cddfc6")] }}).toArray( function (err, docs) {
			if(err) {
				console.log(err);
				return;
			}
												
			if(docs) {
				for(var i = 0; i < docs.length; i++) {
					insertPrices(db,docs[i]);	
				}
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

			processRawPriceFiles(db);
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

