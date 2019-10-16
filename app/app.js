class App {
	constructor() {
		this.screen = document.getElementById('screen');

		this.connection = new WebSocket('ws://localhost:8000');
		this.connection.addEventListener('open', ()=>{});
		this.connection.addEventListener('message', this.onMessage.bind(this));

		this.chat = new Chat(this);

		this.openScreen(this.chat);
	}

	openScreen(/*Service*/ service) {
		this.screen.innerHTML = '';
		this.screen.appendChild(this.chat.elem);
	}

	onMessage(message) {
		let event = JSON.parse(message.data);
		switch (event.type) {
			case 'message':
				this.chat.wrireline(event.data);
				break;

			default:
				console.log('unknown event', event);
				break;
		}
	}

	send(message) {
		if (this.connection.readyState === WebSocket.OPEN) {
			this.connection.send(JSON.stringify({
				type: 'message',
				data: message,
			}));
		}
	}
}

class Service {
	constructor(app) {
		this.app = app;
		this.elem = document.createElement('div');
	}
}

class Chat extends Service{
	constructor(app) {
		super(app);
		this.textarea = document.createElement('textarea');
		this.textarea.disabled = true;
		this.textarea.style.width =
			this.textarea.style.height = '500px';
		this.textarea.style.display = 'block';

		this.messageline = document.createElement('input');
		this.messageline.addEventListener('keydown', this.keydown.bind(this));
		this.messageline.style.display = 'block';
		this.messageline.style.width = '500px';
		this.messageline.style.height = '40px';

		this.elem.appendChild(this.textarea);
		this.elem.appendChild(this.messageline);
	}

	wrireline(message) {
		this.textarea.value += '\n' + message;
	}

	keydown(e) {
		let kc = e.which || e.keyCode;
		if (kc === 13) {
			let m = this.messageline.value.trim();
			if (m !== '') {
				this.app.send(this.messageline.value);
				this.wrireline(this.messageline.value);
				this.messageline.value = '';
			}
		}
	}
}

const app = new App();