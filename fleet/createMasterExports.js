const fs = require('fs');
const R = require('ramda');

module.exports = () => {
    const packages = fs.readdirSync('./output');

    const imported = R.reduce((master, dir) => {
	if(dir == 'Call') {
	    return master;
	}

	let req;
	try {
	    req = require('../output/' + dir + '/index.js');
	} catch(e) {
	    console.error('Got error when require : ', dir);
	}

	let keys = R.keys(req);

	keys = R.filter((key) => req[key] && req[key].hasOwnProperty('create'), keys);
	
	return R.reduce((master, key) => {
	    master[key] = `require("./output/${dir}", {loadOriginal: true})["${key}"]`;
	    
	    return master;
	}, master, keys);

    }, {},  packages);

    let str = 'module.exports = {\n';

    R.forEach((pair) => {
	str += `"${pair[0]}": ${pair[1]},\n`;
    }, R.toPairs(imported));

    str += '\n}';

    fs.writeFileSync('./OutputExports.js', str);
};

