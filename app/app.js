class App {
	constructor() {
		this.screen = document.getElementById('screen');

		this.connection = new WebSocket('ws://localhost:8000');
		this.connection.addEventListener('open', ()=>{});
		this.connection.addEventListener('message', this.onMessage.bind(this));

		this.auth = new Authentication(this);
		this.chat = new Chat(this);
		this.folderSys = new FolderSystem(this);

		this.openScreen(this.auth);
	}

	openScreen(/*Service*/ service) {
		this.screen.innerHTML = '';
		this.screen.appendChild(service.elem);
	}

	onMessage(message) {
		let event = JSON.parse(message.data);
		switch (event.type) {
			case 'message':
				this.chat.wrireline(event);
				break;

			case 'cardSys':
				this.cardSys.dataRecieved(event.data);
				break;

			case 'auth':
				if (event.value === 'success')
					this.openScreen(this.chat);
				break;

			default:
				console.log('unknown event', event);
				break;
		}
	}

	send(message) {
		if (this.connection.readyState === WebSocket.OPEN) {
			this.connection.send(JSON.stringify(message));
		}
	}
}

class Service {
	constructor(app) {
		this.app = app;
		this.elem = document.createElement('div');
	}
}

class Chat extends Service {
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
		this.textarea.value += '\n' +
			'['+ message.from +'] '+
			message.data;
	}

	keydown(e) {
		let kc = e.which || e.keyCode;
		if (kc === 13) {
			let m = this.messageline.value.trim();
			if (m !== '') {
				let msg = {
					from: 'me',
					type: 'message',
					data: this.messageline.value,
				};
				this.messageline.value = '';
				this.app.send(msg);
				this.wrireline(msg);
			}
		}
	}
}

class FolderSystem extends Service {
	constructor(app) {
		super(app);
	}

	dataRecieved() {

	}
}

class Authentication extends Service {
	constructor(app) {
		super(app);
		this.nickname = document.createElement('input');
		this.nickname.addEventListener('keydown', this.keydown.bind(this));
		this.nickname.style.display = 'block';
		this.nickname.style.width = '500px';
		this.nickname.style.height = '40px';
		this.nickname.style.margin = '0 auto';
		this.nickname.placeholder = 'nickname';
		this.elem.appendChild(this.nickname);
	}

	keydown(e) {
		let kc = e.which || e.keyCode;
		if (kc === 13) {
			let name = this.nickname.value.trim();

			if (name.length < 3) return;

			// todo request for auth
			this.app.send({
				type: 'auth',
				name: name,
				pass: 'nopass',
			});
		}
	}
}

const app = new App();