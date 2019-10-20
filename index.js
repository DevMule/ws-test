"use strict";
global.log = console.log;

const WebSocket = require('ws');
const StaticServer = require('static-server');
StaticServer.createServer(__dirname + '\\app');

let BattleshipMess = {
	waits: [],
	gameByPlayer: new Map(),
	setGame: function (p1) {
		if (this.waits[0] && this.waits[0] !== p1) {
			let p2 = this.waits.pop();
			let pair = [p1, p2];
			this.gameByPlayer[p1] = pair;
			this.gameByPlayer[p2] = pair;
			return true;
		} else {
			this.waits.push(p1);
			return false;
		}
	},
	removeGame: function (p1) {
		let game = this.gameByPlayer[p1];
		this.gameByPlayer.delete(game[0]);
		this.gameByPlayer.delete(game[1]);
		return game;
	},
	isWait: function (p1) {
		return this.waits.includes(p1)
	},
	stopWait: function (p1) {
		for (let i = 0; i < this.waits.length; i++)
			if (this.waits[i] === p1) this.waits.splice(i, 1);
	}
};

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

		// battleships
		if (BattleshipMess.gameByPlayer[ws]) {
			let game = BattleshipMess.removeGame(ws);
			let otherPlayer = game[0] !== ws ? game[0] : game[1];
			otherPlayer.send(JSON.stringify({
				type: 'Battleship',
				value: 'stop',
				gameStatus: 'offline',
			}));
		}
		if (BattleshipMess.isWait(ws)) BattleshipMess.stopWait(ws);
	};

	ws.onmessage = function (msg) {
		msg = JSON.parse(msg.data);
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

			case 'Battleship':
				if (msg.value === 'new') {
					if (BattleshipMess.gameByPlayer[ws])
						BattleshipMess.removeGame(ws);
					let isGame = BattleshipMess.setGame(ws);
					let res = {
						type: 'Battleship',
						value: 'new',
						gameStatus: isGame ? 'online' : 'waiting',
						isYourTurn: false,
					};

					if (isGame) {
						let game = BattleshipMess.gameByPlayer[ws];
						game[0].send(JSON.stringify(res));
						res.isYourTurn = true;
						game[1].send(JSON.stringify(res));
					} else {
						ws.send(JSON.stringify(res));
					}

				} else if (msg.value === 'stop') {
					let res = {
						type: 'Battleship',
						value: 'stop',
						gameStatus: 'offline',
					};

					let iswait = BattleshipMess.isWait(ws);
					if (iswait) {
						BattleshipMess.stopWait(ws);
						ws.send(JSON.stringify(res));
					} else {
						let game = BattleshipMess.removeGame(ws);
						game[0].send(JSON.stringify(res));
						game[1].send(JSON.stringify(res));
					}
				} else if (msg.value === 'turn') {
					let game = BattleshipMess.gameByPlayer[ws];
					if(!game) return;

					// player can move - false - p1's move, else - p2's move
					let otherPlayer = game[0] !== ws ? game[0] : game[1];
					otherPlayer.send(JSON.stringify(msg));
					game[2] = !game[2];

				} else if (msg.value === 'status') {
					let game = BattleshipMess.gameByPlayer[ws];
					let otherPlayer = game[0] !== ws ? game[0] : game[1];
					otherPlayer.send(JSON.stringify(msg));
				}
				break;

			default:
				log('unknown type', msg.type);
				break;
		}
	}
});