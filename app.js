
var express = require('express'),
app = express(),
http = require('http'),
server = http.createServer(app),
Twit = require('twit'),
io = require('socket.io').listen(server);

var port = process.env.PORT || 5000;

server.listen(port);

// routing
app.get('/', function (req, res) {
  console.log(req.headers);
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static(__dirname + '/public'));


var India = [ '65', '7', '100', '40' ];
var total=0;
var totalSent=0;

var T = new Twit({
  consumer_key: 'CPqSm2uqyLJJ3IzuIFEGwtlnL',
  consumer_secret: '6qPrdGuKRSwabNbSZjczdncp3bqht8zKXGziqedKxqgX4kIYIc',
  access_token: '3179275620-eXRotFalJIUeQ4pAtyaXLnsDlGWLjn1NJrmqL2m',
  access_token_secret: 'hKUimj72qFiVnNWN7RoEQvpSqJK4pPgmXdTzjxPDsJF0D'
});

var stream = T.stream('statuses/filter', { locations: India});
stream.on('error',function(error){
  console.log(error);
});
stream.on('limit', function (limitMessage) {
  console.log("Limit:"+JSON.stringify(limitMessage));
});
stream.on('tweet', function (tweet) {
  if(tweet.geo){
    total+=1;
    var coords=tweet.geo.coordinates;
    clients.forEach(function(socket){
      var currentBounds=bounds_for_socket[socket.id];

      if(currentBounds&&(coords[1]>currentBounds[0])&&(coords[0]>currentBounds[1])
                      &&(coords[1]<currentBounds[2])&&(coords[0]<currentBounds[3])){

        totalSent+=1;
        if(totalSent%100==0)console.log("Sent:"+totalSent);
        var smallTweet={
          text:tweet.text,
          user:{   screen_name:       tweet.user.screen_name,
                   profile_image_url: tweet.user.profile_image_url,
                   id_str:            tweet.user.id_str},
          geo:tweet.geo
        };
        socket.emit('stream',smallTweet);
      }
    });
  }
  });

var bounds_for_socket={}; // Will contains a hash association between socket_id -> map bound for this client
var clients=[];  // the list of connected clients
io.sockets.on('connection', function (socket) {
  socket.on('recenter',function(msg){
    console.log("recenter:"+msg);
    bounds_for_socket[this.id]=JSON.parse("["+msg+"]");
  });
  socket.on('disconnect',function(socket){
    //  Here we try to get the correct element in the client list
    for(var i=0;i<clients.length;i++){
      client=clients[i];
      if(client.client.id==this.id){clients.splice(i,1)}
    }
    delete bounds_for_socket[this.id];

    console.log("disconnect , there is still:"+clients.length+" connected ("+Object.keys(bounds_for_socket).length+')');
  });
  clients.push(socket); // Update the list of connected clients
  console.log(clients);
  currentBounds=JSON.parse(socket.handshake.query.bounds);
  bounds_for_socket[socket.id]=currentBounds;
  console.log('Connected, total:'+clients.length+' ('+Object.keys(bounds_for_socket).length+')');
});
;
