var request = require('request');
var config = require('./config.js');

var express= require('express');
var app = express();

app.use(express.static(__dirname + '/public'))

var toppings  = [
	'Banana Peppers',
	'Jalapeno Peppers',
	'Mushrooms',
	'Cheese',
	'Robust Inspired Tomato Sauce',
	'Beef',
	'American Cheese',
	'Pineapple',
	'Black Olives',
	'Hot Sauce',
	'Italian Sausage',
	'Hearty Marinara Sauce',
	'Green Peppers',
	'Roasted Red Peppers',
	'Salami',
	'Shredded Parmesan Asiago',
	'BBQ Sauce',
	'Shredded Provolone Cheese',
	'Diced Tomatoes',
	'Onions',
	'Pepperoni',
	'Spinach',
	'Premium Chicken',
	'Feta Cheese',
	'Anchovies',
	'Ham',
	'Bacon',
	'Sliced Italian Sausage',
	'Philly Steak',
	'Cheddar Cheese',
	'Garlic Parmesan White Sauce'
];

function popularityToTopping(popularity){
	var asdf = (31*popularity)/100;
	return [ toppings[Math.ceil(asdf)], toppings[Math.floor(asdf)] ];
}

app.get('/goauth',function(req,res){
	var url ='https://accounts.spotify.com/authorize/?client_id='+config.CLIENT_ID+'&response_type=code&redirect_uri='+config.callbackURL+'&scope=user-read-private%20user-read-email';
	res.redirect(url);
});

app.get('/auth', function (req, res) {
	var code = req.query.code;
	
	var url = 'https://accounts.spotify.com/api/token';
	var body = {'grant_type' : "authorization_code", 'code' : code, 'redirect_uri' : config.callbackURL};

	var header = {'Authorization' : 'Basic '+ (new Buffer([config.CLIENT_ID,config.CLIENT_SECRET].join(":")).toString('base64')) }

	var options = {
		url: url,
		method : "POST",
		headers: header,
		form: body
	};

	request(options, function(error, response, body){
		var rt = JSON.parse(body).refresh_token;
		refresh_token = rt;
		console.log(rt);
		res.send(rt)
	});
});

function getAccessToken(callback){

	var url = 'https://accounts.spotify.com/api/token';
	var body = {
		'grant_type' : 'refresh_token',
		'refresh_token' : refresh_token
	};

	var header = {'Authorization' : 'Basic '+ (new Buffer([config.CLIENT_ID, config.CLIENT_SECRET].join(":")).toString('base64')) }

	var options = {
		url: url,
		method : "POST",
		headers: header,
		form: body
	};

	request(options, function(error, response, body){
		var at = JSON.parse(body).access_token;
		callback(at);
	});
}

function getSpotify(url, callback){
	getAccessToken(function(at){
		var options = {
			url: url,
			headers: {
				"Authorization": "Bearer "+at
			}
		};
		request(options, callback);
	});
}

app.get('/spotify/:user',function(req,res){
	var url = "https://api.spotify.com/v1/users/"+req.params.user+"/playlists";
	getSpotify(url,function(err,response,body){
		try {
			var pl = JSON.parse(body).items;
			var playlists = pl.map(function(a){return {'name': a.name, 'id': [a.id,a.owner.id].join("~")}; });
			var playlist = pl.filter(function(item){
				return item.name == "Starred";
			})[0].tracks.href;

			getSpotify(playlist, function(err,response,body){
				try {
					var popularity = 0;
					var items = JSON.parse(body).items;
					items.forEach(function(item){
						popularity += item.track.popularity;
					});
					var toppings = popularityToTopping(popularity/items.length);
					res.json({'toppings':toppings, 'playlists': playlists});
				} catch (e){
					res.json(e);
				}
			});
		} catch (e){
			res.json(e);
		}
	});
});

app.get('/spotify/:user/:playlist', function(req,res){
	getSpotify('https://api.spotify.com/v1/users/'+req.params.user+'/playlists/'+req.params.playlist+'/tracks', function(err,response,body){
		try {
			var popularity = 0;
			var items = JSON.parse(body).items;
			items.forEach(function(item){
				popularity += item.track.popularity;
			});
			var toppings = popularityToTopping(popularity/items.length);
			res.json({'toppings': toppings});
		} catch (e){
			res.json(e);
		}
	});
});

app.listen(3749);