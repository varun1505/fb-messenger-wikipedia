var request = require('request');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var compression = require('compression');

var conf = require('./conf');

var app = express();
app.use(compression());
app.use(bodyParser.json());

var httpServer = http.createServer(app);

app.get('/', function (req, res, next) {
  res.send('Welcome to Facebook Messenger Bot. This is root endpoint');
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
			sendMessage(senderId, 'Hey! Sup?', true);
		}
	});
	res.sendStatus(200);
});


var sendMessage = function(to, msgTxt) {
	var msgPayload = {
		recipient: {
			id: to
		},
		msg: {
			text: msgText	
		}		
	};

	var reqConf = {
		url: conf.FB_URL + '?access_token' + conf.PAGE_TOKEN,
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