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
		data: 'hello, server greet'
	}));

	ws.onclose = function () {
		log('disconnected');
	};
	ws.onmessage = function (msg) {
		msg = JSON.parse(msg.data);
		log(msg.type, msg.data);
		switch (msg.type) {
			case 'message':
				wss.clients.forEach(cli => {
					if (cli !== ws) {
						cli.send(JSON.stringify(msg));
					}
				});
				break;

			default:
				log('unknown type', msg.type);
				break;
		}
	}
});