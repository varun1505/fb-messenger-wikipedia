var request = require('request');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var compression = require('compression');
var wikipedia = require("wikipedia-js");

var Wiki = require('wikijs'); 
var wiki = new Wiki();

var conf = require('./conf');

var app = express();
app.use(compression());
app.use(bodyParser.json());

var httpServer = http.createServer(app);

app.get('/', function (req, res, next) {
	console.log(conf);
  res.send('Welcome to Facebook Messenger Bot. This is root endpoint');
});

app.get('/wiki1', function(req, res){

	var query = req.query.q;

	var options = {query: req.query.q, format: "json", summaryOnly: false};
	wikipedia.searchArticle(options, function(err, htmlWikiText){
		if(err){
			console.log('An Error Occured!');
		} else {
			// res.send(htmlWikiText);
			res.json({
				text: JSON.parse(htmlWikiText)
			})
			//console.log("Query successful[query=%s, html-formatted-wiki-text=%s]", query, htmlWikiText);	
		}
		
	});
});

app.get('/wiki', function(req, res){

	var query = req.query.q;
	var result = {};
	wiki.search(query).then(function(results) {
		if(results.results.length > 0) {
			wiki.page(results.results[0]).then(function(page){
				// get page summary
				page.summary().then(function(summary){
					res.send(summary);
				})
				
			})
		} else {
			res.json({error: true});
		}
		/*console.log(results);
		res.json(results);*/

		/*page.content().then(function(info) {
			res.json({info: info});
			console.log(info['alter_ego']); // Bruce Wayne 
		});*/
	});
	
});

//handle verification
app.get('/webhook/', function(req, res){
	if (req.query['hub.verify_token'] === conf.VERIFICATION_TOKEN) {
    	res.send(req.query['hub.challenge']);
    } else {
		res.send('Error, wrong validation token');    
	} 
});

//handle received messages
app.post('/webhook/', function(req, res){
	var msgInstances = req.body.entry[0].messaging;
	msgInstances.forEach(function(instance){
		var senderId = instance.sender.id;
		if(instance.message && instance.message.text) {
			var msgText = instance.message.text;
			wiki.search(msgText).then(function(results) {
				if(results.results.length > 0) {
					wiki.page(results.results[0]).then(function(page){
						// get page summary
						page.summary().then(function(summary){
							//res.send(summary);
							sendMessage(senderId, summary);
						})
						
					})
				} else {
					sendMessage(senderId, "We couldn't find what you asked for. Please try searching for something else.");
				}				
			});
			
		}
	});
	res.sendStatus(200);
});


var sendMessage = function(to, msgTxt) {
	var msgPayload = {
		recipient: {
			id: to
		},
		message: {
			text: msgTxt	
		}		
	};

	var reqConf = {
		url: conf.FB_URL + '?access_token=' + conf.PAGE_TOKEN,
		method: 'POST',
		json: msgPayload
	}

	request(reqConf, function(err, resp){
		if(err) console.log('Error: ', err);
		if(resp.body.error) console.log('Error: ', resp.body.error);
	});
}

httpServer.listen(conf.PORT, function() {
	console.log("Express listening on " + conf.PORT);
});