const express = require('express');
const bodyParser = require('body-parser');
const R = require('ramda');
const C = require('colors/safe');
const uuid = require('uuid');
const cluster = require('cluster');
const WebSocket = require('ws');
const StatsD = require('hot-shots');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

const createNamespace = require('continuation-local-storage').createNamespace;


// Import serialization and deserialization module
const { serialize, deserialize } = require('./serialization');

const { isRPCTransactional, registerTransaction, sequelize } = require('./transactionManagement');

const startServer = (valueEndpoints, apiSpec, moduleToWrap, host, port, appName) => {
    const wss = new WebSocket.Server({port});

    console.log('starting API server for ' + moduleToWrap);

    let module = require(`../../${moduleToWrap}`);

    wss.on('connection', (ws) => {
	ws.on('message', (message) => {
	    sequelize.transaction().then(async((transaction) => {
		let namespace = createNamespace('transaction');
		namespace.run(function () {
		    message = JSON.parse(message);

		    let isTxnOrigin = registerTransaction(namespace, apiSpec, ws, message, transaction);
		    
		    let id = uuid.v4();
		    
		    let requestBegin = Date.now();
		    
		    console.log(C.blue('Request ' + id + ' ' + Date.now() + ':\n' + JSON.stringify(message, 0, 2)));
		    
		    let request = R.map((serBody) => {
			return deserialize(serBody, {});
		    }, message.args);
		    
		    try {
			let response = await(R.uncurryN(request.length, module[message.method]).apply(null, request));
			
			let serialResp = serialize(response);
			
			console.log(C.cyan('Response ' + id + ' ' + Date.now() + ':\n' + JSON.stringify(serialResp, 0, 2)));
			
			//	    client.timing(`${key}_timing`, Date.now() - requestBegin);
			if(isTxnOrigin) {
			    let transaction = isRPCTransactional();
			    if(transaction) {
				console.log('Got back transaction, commit');
				transaction.dbTransaction.commit();
			    }
			}
			ws.send(JSON.stringify({id: message.id, args: serialResp}));
		    } catch(e) {
			console.log(e, message);
		    }
		});
		//	    client.increment(`${key}`)
	    }));
	});
    });
};

exports.startServer = (valueEndpoints, apiSpec, moduleToWrap, host, port, appName) => {    
    if (cluster.isMaster) {
    	let cpuCount = 1 //require('os').cpus().length;
    	console.log(C.yellow(`ApiServer ::: Starting HTTP service ${apiSpec.name} with ${cpuCount} processes on  ${host}:${port}`))
	
    	for (let i = 0; i < cpuCount; i += 1) {
            cluster.fork();
    	}
    } else {
    	startServer(valueEndpoints, apiSpec, moduleToWrap, host, port, appName);
    }
};
