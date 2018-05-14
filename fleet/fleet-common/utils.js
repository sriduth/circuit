const R = require('ramda');

const argCount = (curriedFunction) => {
    if(typeof curriedFunction == 'object') {
	return {type: 'value', value: curriedFunction};
    }
    
    let src = curriedFunction.toString();
    let match;
    let regex = new RegExp('return function .(.).', 'g');
    let levels = src.match(/return function .(.)./g);
  
    if(levels) {
	return {type: 'args', value: levels.length + 1};
    } else {
	return {type: 'args', value: 1};
    }

    return {type: 'ignore', value: null}
};

const curry = (curriedFunction, callback) => {
    let src = curriedFunction.toString();
    let match;
    let levels = [];
    while(match = /return function .(.)./g.exec(src)) {
	levels.push(match[1]);
    }

    return R.curryN(levels.length + 1, callback);
}

module.exports = { curry, argCount };
