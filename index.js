"use strict";
const WebSocket = require('ws');
const StaticServer = require('static-server');
StaticServer.createServer(__dirname + '\\app');

global.log = console.log;

// ws
const wss = new WebSocket.Server({port: 8000});
wss.on('connection', (ws) => {

	log('connected');
	ws.send(JSON.stringify({
		type: 'message',
		data: 'hello, you are connected',
	}));

	ws.onclose = function () {
		log('disconnected');
	};
	ws.onmessage = function (msg) {
		var message = JSON.parse(msg.data);
		log(message.type, message.data);
		wss.clients.forEach(cli => {
			if (cli !== ws) {
				cli.send(JSON.stringify({
					type: 'message',
					data: message.data,
				}));
			}
		})
	}
});