class App {
	constructor() {
		this.screen = document.getElementById('screen');

		this.connection = new WebSocket('ws://localhost:8000');
		this.connection.addEventListener('open', () => {
		});
		this.connection.addEventListener('message', this.onMessage.bind(this));

		this.auth = new Authentication(this);
		this.chat = new Chat(this);
		this.folderSys = new FolderSystem(this);
		this.battleshipGame = new Battleship(this);

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
					this.openScreen(this.battleshipGame);
				break;

			case 'Battleship':
				this.battleshipGame.onEvent(event);
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
		this.elem.style.textAlign = 'center';
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
			'[' + message.from + '] ' +
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

class Battleship extends Service {
	constructor(app) {
		super(app);
		// service ui
		this.newGameButton = document.createElement('button');
		this.newGameButton.innerHTML = 'new game';
		this.newGameButton.addEventListener('click', this.onStartGameClick.bind(this));
		this.resetBoardButton = document.createElement('button');
		this.resetBoardButton.innerHTML = 'reset board';
		this.resetBoardButton.addEventListener('click', this.resetBoard.bind(this));
		this.gameStatusText = document.createElement('p');
		this.gameStatusText.innerHTML = 'offline';
		this.elem.appendChild(this.newGameButton);
		this.elem.appendChild(this.resetBoardButton);
		this.elem.appendChild(this.gameStatusText);

		this.centerDiv = document.createElement('div');
		this.centerDiv.style.margin = '0 auto';
		this.elem.appendChild(this.centerDiv);

		this.myBoard = this.getNewBoard();
		this.centerDiv.appendChild(this.myBoard.board);
		this.enemyBoard = this.getNewBoard();
		this.centerDiv.appendChild(this.enemyBoard.board);

		this.battleLog = document.createElement('textarea');
		this.battleLog.disabled = true;
		this.battleLog.style.width = '70%';
		this.battleLog.style.height = '200px';
		this.battleLog.style.resize = 'none';
		this.battleLog.style.margin = '0 auto';
		this.centerDiv.appendChild(this.battleLog);

		// service values
		this.myTurn = true;
		this.gameStatus = "offline";
		this.myShips = [];
		this.randomizeShips(this.myBoard);
	}

	onEvent(event) {
		switch (event.value) {
			case 'new':
				this.wrireline('new game, status: ' + event.gameStatus);
				this.gameStatus =
					this.gameStatusText.innerHTML = event.gameStatus;
				if (event.gameStatus === 'online') {
					this.wrireline(event.isYourTurn ? 'MY TURN' : 'ENEMY\'s TURN');
					this.myTurn = event.isYourTurn;
				}
				this.resetBoardButton.disabled = true;
				break;

			case 'stop':
				this.wrireline('game stopped!');
				this.gameStatus =
					this.gameStatusText.innerHTML = event.gameStatus;
				this.resetBoardButton.disabled = false;
				break;

			case 'turn':
				let ship = this.isShip(this.myBoard, event.col, event.row);
				let isHit = !!ship;
				let deadShip = this.getShipIfDead(this.myBoard, ship);
				this.hitBoard(this.myBoard, event.col, event.row, isHit);
				this.sendStatus(isHit, event.col, event.row, deadShip);
				if (!isHit)
					this.myTurn = true;
				this.wrireline(`enemy\'s turn: ${event.col}, ${event.row}, ${isHit ? 'HIT, its turn again' : 'MISS, my turn'}`);
				break;

			case 'status':
				this.hitBoard(this.enemyBoard, event.col, event.row, event.isHit);
				if (event.isHit) this.myTurn = true;
				this.wrireline(event.isHit ? `we hit the enemy, we can make turn again!` : `we miss, enemy's turn`);
				break;


			default:
				break;
		}
	}

	onStartGameClick() {
		switch (this.gameStatus) {
			case "offline":
				this.app.send({
					type: "Battleship",
					value: "new"
				});
				break;

			case "online":
				this.app.send({
					type: "Battleship",
					value: "stop"
				});
				break;

			case "waiting":
				this.app.send({
					type: "Battleship",
					value: "stop"
				});
				break;

			default:
				break;
		}
	}

	wrireline(message) {
		this.battleLog.value += '\n' + message;
	}

	// game interface
	sendStatus(isHit, col, row, ship) {
		this.app.send({
			type: 'Battleship',
			value: 'status',
			isHit: isHit,
			ship: ship,
			col: col,
			row: row,
		});
	}

	sendClick(col, row) {
		this.app.send({
			type: 'Battleship',
			value: 'turn',
			col: col,
			row: row,
		});
	}

	isShip(board, col, row) {
		return board.data[row][col];
	}

	getShipIfDead(board, ship) {
		let shipsLength = ship.length;
		for (let i = 0; i < shipsLength; i++) {
			let segment = ship[i];
			shipsLength -= this.isAlreadyHited(board, segment[0], segment[1]);
			console.log(shipsLength);
		}
		return shipsLength === 0;
	}

	isAlreadyHited(board, col, row) {
		let btn = board.chunks[row][col];
		return !!btn.click;
	}

	hitBoard(board, col, row, isHit = false) {
		let btn = board.chunks[row][col];
		btn.removeEventListener('click', this.onBoardClick.bind(this, board, col, row));
		btn.style.opacity = '0.5';
		if (isHit)
			btn.style.color =
				btn.style.backgroundColor = '#ff9999';
	}

	// board interface
	onBoardClick(board, col, row) {
		if (this.myTurn && board === this.enemyBoard) {
			this.myTurn = false;
			this.wrireline(`my turn: ${col}, ${row}, now enemy\'s turn`);
			this.sendClick(col, row);
		}
	}

	getNewBoard() {
		let board = {};
		board.chunks = [];
		board.data = [];
		board.board = document.createElement('TABLE');
		board.board.style.margin = '40px';
		board.board.style.display = 'inline-block';
		for (let row = 0; row < 10; row++) {

			board.chunks.push([]);
			board.data.push([]);

			let rowElem = document.createElement("TR");
			board.board.appendChild(rowElem);

			for (let col = 0; col < 10; col++) {

				let colElem = document.createElement("TD");
				colElem.style.margin =
					colElem.style.padding = '0px';
				rowElem.appendChild(colElem);

				let btn = document.createElement("div");
				btn.style.width =
					btn.style.height = '30px';
				btn.style.color =
					btn.style.backgroundColor = '#999999';
				colElem.appendChild(btn);

				board.chunks[row].push(btn);
				board.data[row].push(null);

				btn.addEventListener('click', this.onBoardClick.bind(this, board, col, row));
			}
		}
		return board;
	}

	clearBoard(board) {
		this.myships = [];
		for (let row = 0; row < board.chunks.length; row++)
			for (let col = 0; col < board.chunks[row].length; col++) {
				let btn = board.chunks[row][col];
				btn.style.color =
					btn.style.backgroundColor = '#999999';
				btn.addEventListener('click', () => {
					this.onBoardClick(board, col, row)
				});
				board.data[row][col] = null;
			}
	}

	randomShip(size) {
		let shipStart = [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
		let shipShift = Math.random() > .5 ? [Math.random() > .5 ? 1 : -1, 0] : [0, Math.random() > .5 ? 1 : -1];
		let ship = [];
		for (let i = 0; i < size; i++) {
			ship.push([shipStart[0], shipStart[1]]);
			shipStart[0] += shipShift[0];
			shipStart[1] += shipShift[1];
		}
		return ship;
	}

	isCollision(board, ship) {
		for (let i = 0; i < ship.length; i++) {
			let shipSegment = ship[i];

			if (shipSegment[0] > 9 || shipSegment[0] < 0 || shipSegment[1] > 9 || shipSegment[1] < 0)
				return true;

			for (let row = -1; row < 2; row++) {
				let checkRow = row + shipSegment[0];
				if (checkRow >= 0 && checkRow <= 9)

					for (let col = -1; col < 2; col++) {
						let checkCol = col + shipSegment[1];
						if (checkCol >= 0 && checkCol <= 9)
							if (board.data[checkRow][checkCol])
								return true;
					}

			}
		}
		return false;
	}

	placeShip(board, ship) {
		for (let i = 0; i < ship.length; i++) {
			let segment = ship[i];
			board.data[segment[0]][segment[1]] = ship;
			let btn = board.chunks[segment[0]][segment[1]];
			btn.style.color =
				btn.style.backgroundColor = '#ff9999';
		}
		this.myShips.push(ship);
	}

	randomizeShips(board) {
		let shipsizes = [
			4,
			3, 3,
			2, 2, 2,
			1, 1, 1, 1,
		];

		for (let i = 0; i < shipsizes.length; i++) {
			let collisionPass = false;
			let ship = [];
			while (!collisionPass) {
				ship = this.randomShip(shipsizes[i]);
				collisionPass = !this.isCollision(board, ship);
			}
			this.placeShip(board, ship);
		}
	}

	resetBoard() {
		this.myships = [];
		this.clearBoard(this.myBoard);
		this.randomizeShips(this.myBoard);
	}
}

const app = new App();