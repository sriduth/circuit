const ws = require('ws');
const uuid = require('uuid');
const R = require('ramda');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

const { isRPCTransactional } = require('./transactionManagement');

let sockets = {};

let socket;
let status = {};
let queue = {};
let pending = [];

exports.prepareClient = function prepareClient (apiSpec) {
    sockets[apiSpec.name] = new ws(`ws://${apiSpec.configuration.host}:${apiSpec.configuration.port}`);

    sockets[apiSpec.name].on('open', () => {
	status[apiSpec.name] = 'ok';

	R.map((message) => {
	    sockets[message.service].send(JSON.stringify(message.payload));
	}, pending);

	pending = [];
    });

    sockets[apiSpec.name].on('close', () => {
	status[apiSpec.name] = 'closed';
	setTimeout(() => prepareClient(apiSpec), 2000);
    });
    
    sockets[apiSpec.name].on('message', (message) => {
	message = JSON.parse(message);

	if(queue.hasOwnProperty(message.id)) {
	    queue[message.id].resolve(message.args);
	} else {
	    queue[message.id].reject("bad message");
	}
	
	delete queue[message.id];
    });
};

exports.send = (apiSpec, method, message) => {
    let txn = isRPCTransactional();
    
    let id = uuid.v4();
    let payload;

    if(txn) {
	payload = {id, method, args: message, transaction: txn.detail};
    } else {
	payload = {id, method, args: message, transaction: null};
    }

    let promise = new Promise((resolve, reject) => {
	queue[id] = {resolve, reject};
    });
  
    if(status[apiSpec.name] == 'ok') {
	sockets[apiSpec.name].send(JSON.stringify(payload));
    } else {
	pending.push({service: apiSpec.name, payload});
    }

    return promise;
};
