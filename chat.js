var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var usersList = {};
var conversations = {};

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));

io.on('connection', function (socket) {
	socket.on('chat message', function(msg) {
		io.emit('chat message', msg);
		socket.emit('get userID', socket.id);
	});

	socket.on('typing', function(typing, name) {
		socket.broadcast.emit('toggle typing', typing, name);
	});

	socket.on('userChatName', function(name, callback) {
		if(!usersList[name] && name.length > 2){
	        socket.broadcast.emit('chat message', '<div class="notification"><b>' + name + '</b> has joined the room </div>');
			usersList[name] = socket.id;

			io.emit('users list', usersList);
			socket.emit('get userID', socket.id);

			callback(true);
	    } else{
	        callback(false);
	    }
	});

	socket.on('disconnect', function() {
		var userName, conversation;

		for (userName in usersList) {
			if (usersList[userName] == socket.id) {
				socket.broadcast.emit('chat message', '<div class="notification"><b>' + userName + '</b> has left the room </div>');
				socket.broadcast.emit('toggle typing', false, userName);
				delete usersList[userName];
			}
		}

		for (conversation in conversations) {
			if (conversations[conversation].indexOf(socket.id) != -1) {
				conversations[conversation].splice(socket.id, 1);
			}

			if (conversations[conversation].length == 1) {
				delete conversations[conversation];
				socket.leave(conversation);
			}
		}

		io.emit('users list', usersList);
		io.emit('createChatRooms', conversations);
	});

	socket.on('subscribe', function(data) {
		if (!conversations[data.room]) {
			conversations[data.room] = data.users_id;
			socket.join(data.room);
			io.emit('createChatRooms', conversations);
			console.log(conversations);
		}
	});
});

http.listen(3000);



