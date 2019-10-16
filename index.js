"use strict";
global.log = console.log;

const WebSocket = require('ws');
const StaticServer = require('static-server');
StaticServer.createServer(__dirname + '\\app');

// ws
const wss = new WebSocket.Server({port: 8000});
wss.on('connection', (ws) => {

	log('connected');
	ws.send(JSON.stringify({
		type: 'message',
		from: 'SERVER',
		data: 'GREETINGS!'
	}));

	ws.onclose = function () {
		var res = {
			type: 'message',
			from: 'SERVER',
			data: `${ws.name} disconnected!`,
		};
		wss.clients.forEach(cli => {
			cli.send(JSON.stringify(res));
		});
		log(`${ws.name} disconnected!`);
	};

	ws.onmessage = function (msg) {
		msg = JSON.parse(msg.data);
		log(msg.type);
		switch (msg.type) {
			case 'message':
				var res = {
					type: msg.type,
					from: ws.name,
					data: msg.data,
				};
				wss.clients.forEach(cli => {
					if (cli !== ws) {
						cli.send(JSON.stringify(res));
					}
				});
				break;

			case 'folder':
				break;

			case 'auth':
				// todo auth
				var res = {
					type: 'auth',
					value: 'success',
					name: msg.name,
					id: '1234567890',
				};
				ws.name = msg.name;
				ws.send(JSON.stringify(res));
				break;

			default:
				log('unknown type', msg.type);
				break;
		}
	}
});