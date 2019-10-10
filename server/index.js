"use strict";
const WebSocket = require('ws');
const StaticServer = require('static-server');
StaticServer.createServer(__dirname + '\\..\\App');

global.log = console.log;

// ws
const wss = new WebSocket.Server({port: 8000});
wss.on('connection', (ws) => {

	log('connected');
	ws.send('hello, you are connected');

	ws.onclose = function () {
		log('disconnected');
	};
	ws.onmessage = function (message) {
		log(message.data);
		wss.clients.forEach(cli => {
			if (cli !== ws) {
				cli.send(message.data);
			}
		})
	}
});