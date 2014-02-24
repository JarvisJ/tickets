var express  = require('express');
var util= require('util');
var querystring = require('querystring');
var app = express();
var server = require('http').createServer(app );
var OAuth= require('oauth').OAuth;
var consumerKey = "dj0yJmk9THcxd2lhNER6V040JmQ9WVdrOWNYUk5UV1ZYTXpRbWNHbzlNakF3TlRZd05UVTJNZy0tJnM9Y29uc3VtZXJzZWNyZXQmeD0yNA--";
var secretKey = "da811b46aa530baf317e1603df3a5b3e3f022456";


 
server.listen(3000);
var fs = require('fs');

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/baseball.html');
});

app.get('/ndireport.js', function (req, res) {
  res.sendfile(__dirname + '/ndireport.js');
});

app.use(express.static(__dirname + '/public'));


app.get('/baseball.html', function (req, res) {

		
  res.sendfile(__dirname + '/baseball.html');
});

app.get('/bb/:position/:year', function (req, res) {
		switch(req.params.year) {
		case "2013":
			get2013Projections(req.params.position,res);
			break;
		case "Spring":
			getSpringStats(req.params.position,res);
			break;
		default:
			getActualStats(req.params.position,req.params.year,res);
					
		}

});

app.get('/y', function (req, res) {
		yahooSearch("",5,res,function(error, data, response){
				res.json(data);
				res.end();
		});

});

function get2013Projections(position,res) {
	var filePath = __dirname +"/json/" + position +  "Forecast2013.json";

	fs.readFile(filePath, 'utf8', function (err, data) {
	  if (err) {
	    console.log('Error: ' + err);
	    res.end();
	    return;
	  }
	 
	  var jsonObj = JSON.parse(data); 
	  res.json(jsonObj);
	  res.end();
	});		
}

function getActualStats(position,year,res) {
	var filePath = __dirname +"/json/" + position + year + ".json";

	fs.readFile(filePath, 'utf8', function (err, data) {
	  if (err) {
	    console.log('Error: ' + err);
	    res.end();
	    return;
	  }
	 
	  var jsonObj = JSON.parse(data); 
	  res.json(jsonObj.stats_sortable_player.queryResults.row);
	  res.end();
	});		
}

function getSpringStats(position,res) {
	position = position == "batters" ? "Batters" : "Pitchers";		
	var filePath = __dirname + "/json/spring"  + position +  "2013.json";
	var buf = '';	
	
	fs.readFile(filePath, 'utf8', function (err, data) {
	  if (err) {
	    console.log('Error: ' + err);
	    res.end();
	    return;
	  }
	 
	  var jsonObj = JSON.parse(data); 
	  res.json(jsonObj.stats_sortable_player.queryResults.row);
	  res.end();
	});
}

function yahooSearch( query, count,res,
callback_error_data_response){
 var webSearchUrl = "http://fantasysports.yahooapis.com/fantasy/v2/leagues;league_keys=308.l.111510/teams";
 var reqTokURL = "https://api.login.yahoo.com/oauth/v2/get_request_token"
 var accessTokUrl = "https://api.login.yahoo.com/oauth/v2/request_auth"

  var finalUrl = webSearchUrl + '?' + querystring.stringify({
    q: query,  //search keywords
    format: 'json',
    count: count,
  });

  var oa = new OAuth(reqTokURL, accessTokUrl, consumerKey, secretKey, "1.0", null, "HMAC-SHA1");
//  oa.setClientOptions({ requestTokenHttpMethod: 'GET' });
  
oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
  if(error) util.puts('error :' + error)
  else { 
    util.puts('oauth_token :' + oauth_token)
    util.puts('oauth_token_secret :' + oauth_token_secret)
    util.puts('requestoken results :' + util.inspect(results))
    util.puts("Requesting access token")
    oa.getOAuthAccessToken(oauth_token, oauth_token_secret, function(error, oauth_access_token, oauth_access_token_secret, results2) {
      util.puts('oauth_access_token :' + oauth_access_token)
      util.puts('oauth_token_secret :' + oauth_access_token_secret)
      util.puts('accesstoken results :' + util.inspect(results2))
      util.puts("Requesting access token")
      var data= "";
      oa.getProtectedResource(finalUrl, "GET", oauth_access_token, oauth_access_token_secret,  callback_error_data_response);
    });
  }
})
  
}

