var chat = {
	socket: io(),
	chatname: null,
	currentUserId: null,
	usersList: {},
	userActions: [],
	sendBtn: document.querySelector('.send-message'),
	messageBox: document.querySelector('.message-box'),
	chatContainer: document.querySelector('.main-chat-window'),
	userListContainer: document.querySelector('.user-list'),
	typing: false,

	init: function() {
		this.userNameModal();
		this.populateUserList();
		this.sendMessage();

		keyDown('button');
	},

	checkMessageBoxLength: function() {
		var self = this;

		if (self.messageBox.value.length == 0) {
			self.sendBtn.disabled = true;
		} else {
			self.sendBtn.disabled = false;
		}
	},

	populateUserList: function() {
		var userLine, userName, userHtml;
		var self = this;

		this.socket.on('users list', function(userList) {
			self.usersList = userList;
			self.userListContainer.innerHTML = '';

			self.socket.on('get userID', function(id) {
				self.currentUserId = id;
			});

			for (userName in self.usersList) {
				userHtml = '<span data-id="' + self.usersList[userName] + '" class="user-invite">' + userName + '</span>';
				
				userLine = document.createElement('li');
				userLine.setAttribute('class', 'user-line');
				userLine.innerHTML = userHtml;
				self.userListContainer.appendChild(userLine);
			}
		});
	},

	checkIfUserTyping: function(input) {
		var self = this;

		if (input.value.length > 0) {
			if (self.typing == false) {
				self.socket.emit('typing', true, self.chatname);
			}
			self.typing = true;
		} else {
			self.typing = false;
			self.socket.emit('typing', false, self.chatname);
		}
	},

	sendMessage: function() {
		var typingNot;
		var self = this;
		var typingWrapper = document.querySelector('.typing-wrapper');

		this.checkMessageBoxLength();

		this.messageBox.addEventListener('input', function() {
			self.checkMessageBoxLength();
			self.checkIfUserTyping(this);
		});

		this.socket.on('toggle typing', function(typing, name) {
			if (typing) {
				typingNot = document.createElement('div');
				typingNot.setAttribute('class', 'typing-notification-' + name);
				typingNot.innerHTML = name + ' is typing...';
				typingWrapper.appendChild(typingNot);
			} else {
				var typingNot = document.querySelector('.typing-notification-' + name);
				if (typingNot) {
					typingNot.remove();
				}
			}
		});

		this.sendBtn.addEventListener('click', function() {
			self.socket.emit('chat message', 
				'<div class="message-line">' +
				'<span class="nickname">' + self.chatname + '</span> ' + 
				'<span class="message">' + self.messageBox.value + '</span>' +
				'</div>');

			self.messageBox.value = '';
			self.messageBox.focus();
			return false;
		});
		this.appendMsg();
	},

	appendMsg: function() {
		var chatLine;
		var self = this;

		this.socket.on('chat message', function(msg) {
			var id;
			chatLine = document.createElement('div');

			self.socket.on('get userID', function(id) {
				if (self.currentUserId == id) {
 					chatLine.classList.add('user');
				} 
			});

	 		chatLine.setAttribute('class', 'message-line-holder');
			chatLine.innerHTML = msg;
			self.chatContainer.appendChild(chatLine);
			self.chatContainer.scrollTop = self.chatContainer.scrollHeight;
			self.checkMessageBoxLength();
			self.checkIfUserTyping(self.messageBox);
			chatLine.classList.add('received');
		});
	},

	userNameModal: function() {
		var self = this;
		var chatWrapper = document.querySelector('.chat-wrapper');
		var modalOverlay = document.querySelector('.overlay');
		var modalInputSendBtn = document.querySelector('.user-name-submit');
		var modalInput = document.querySelector('.user-name-input');
		var modalError = document.querySelector('.user-name-modal .error');
		var rememberMe = document.querySelector('.remember-me');
		var storedName = window.localStorage.getItem('userName');

		if (storedName) {
			modalOverlay.remove();
			self.messageBox.focus();
			self.chatname = storedName;
			this.socket.emit('userChatName', storedName, function(takenUserName) {
				if (!takenUserName) {
					chatWrapper.innerHTML = '<div class="warning">You cannot open another instance of the chat if username is remembered</div>';
				}
				return false;
			});
		}

		modalInput.focus();

		modalInputSendBtn.addEventListener('click', function() {
			self.chatname = modalInput.value;

			self.socket.emit('userChatName', self.chatname, function(takenUserName) {
				if (takenUserName == false) {
					modalError.style.display = 'block';
					modalInput.focus();
				} else {
					if (rememberMe.checked) {
						window.localStorage.setItem('userName', self.chatname);
					}
					modalOverlay.classList.add('hidden');
					self.messageBox.focus();
					self.userActions = document.querySelectorAll('.user-invite');
					console.log(self.userActions);
					self.joinPrivateRooms(self.userActions);
				}
			});
		});
	},

	joinPrivateRooms: function(actionList) {
		var room;
		var self = this;

		[].forEach.call(actionList, function(userAction) {
			userAction.addEventListener('click', function(e) {
				var target = e.target;
				var userId = target.getAttribute('data-id');

				if (target.nodeName != 'SPAN' || self.currentUserId == userId) return false;
				console.log('xxxxxx');
				room = prompt('What is the rooms name ?');

				self.socket.emit('subscribe', {
					room: room, 
					users_id: [self.currentUserId, target.getAttribute('data-id')]
				});
				self.createPrivateRooms();
			});
		});
	},

	createPrivateRooms: function() {
		var conversationTab, conversation;
		var self = this;
		var conversationsTab = document.querySelector('.conversations-list');

		self.socket.on('createChatRooms', function(conversations) {
			console.log(conversations);
			conversationsTab.innerHTML = '';
			for (conversation in conversations) {
				conversationTab = document.createElement('li');
				conversationTab.setAttribute('class', 'conversation-tab');
				conversationTab.setAttribute('data-chatID', conversation);
				conversationTab.innerHTML = conversation;
				conversationsTab.appendChild(conversationTab);
			}
			
			if (conversationsTab.childNodes.length > 0) {
				conversationsTab.classList.add('with-chats');
			} else {
				conversationsTab.classList.remove('with-chats');
			}
		});
	}
}

chat.init();



