const connection = new WebSocket('ws://localhost:8000');
const screen = document.getElementById('screen');

class Chat {
	constructor() {
		this.elem = document.createElement('div');

		this.textarea = document.createElement('textarea');
		this.textarea.disabled = true;

		this.messageline = document.createElement('input');
		this.messageline.addEventListener('keydown', this.keydown.bind(this));

		this.elem.appendChild(this.textarea);
		this.elem.appendChild(this.messageline);
	}

	wrireline(message) {
		this.textarea.value += '\n' + message;
	}

	keydown(e) {
		let kc = e.which || e.keyCode;
		if (kc === 13) {
			send(this.messageline.value);
			this.messageline.value = '';
		}
	}
}

let chat = new Chat();
screen.appendChild(chat.elem);

connection.addEventListener('open', () => {
	chat.wrireline('connected');
});

connection.addEventListener('message', (message)=>{
	var event = JSON.parse(message.data);
	switch (event.type) {
		case 'message':
			chat.wrireline(event.data);
			break;

		default:
			console.log('unknown event', event);
			break;
	}
});

function send(message) {
	if (connection.readyState === WebSocket.OPEN) {
		connection.send(JSON.stringify({
			type: 'message',
			data: message,
		}));
		chat.wrireline(message);
	}
}

document.send = send();