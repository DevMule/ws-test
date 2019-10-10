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
	chat.wrireline(message.data);
});

function send(message) {
	if (connection.readyState === WebSocket.OPEN) {
		connection.send(message);
		chat.wrireline(message);
	}
}

document.send = send();