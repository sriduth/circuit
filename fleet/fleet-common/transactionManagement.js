const getNamespace = require('continuation-local-storage').getNamespace;
const createNamespace = require('continuation-local-storage').createNamespace;
const uuid = require('uuid');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('mysql://localhost:3306/jdb', 'cloud', 'scape', {
    dialect: 'mysql'
});

const txns = {};

const checkCommitStatus = () => {
    let namespace = getNamespace('transaction');

    if(namespace) {
	let txnId = namespace.get('txnId');
    }
};

const registerTransaction: (session, apiSpec, socket, message, dbTransaction) => {
    let transactionId;
    let transactionSource;

    let isTxnOrigin = false;
    
    if(message.transaction && message.transaction != null) {
	console.log(`${message.id} has transaction, storing txn against socket.`);

	transactionId = message.transaction.transactionId;
	transactionSource = message.transaction.transactionSource;
    } else {
	console.log(`${message.id} has no transaction, ${apiSpec.name} is originator.`);

	isTxnOrigin = true;
	transactionId = uuid.v4();
	transactionSource = apiSpec.name;
    }

    session.set('txnId', transactionId);
    
    txns[transactionId] = txns[transactionId] || {};
    txns[transactionId] = { message, dbTransaction, detail: {transactionId, transactionSource} };

    return isTxnOrigin;
};

const isRPCTransactional = () => {
    let namespace = getNamespace('transaction');
    
    if(namespace) {
	let messageId = namespace.get('txnId');
	
	if(txns.hasOwnProperty(messageId)) {
	    return txns[messageId];
	} else {
	    return null;
	}
    } else {
	return null;
    }
};

module.exports = {
    registerTransaction,
    isRPCTransactional,
    sequelize
}
