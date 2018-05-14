const AllExports = require('../../OutputExports');
const R = require('ramda');

function deserialize(ds, hyd) {
    if(ds == undefined || ds == null) {
	return hyd;
    }
    
    if(ds.cons == 'Function' && AllExports.hasOwnProperty(ds.name)) {
	hyd = AllExports[ds.name];
    } else if(ds.hasOwnProperty('cons')) {
	if(AllExports[ds.cons]) {
	    let argLength = AllExports[ds.cons].length;
	    let argumentNames = R.times(function(ind) {
		return 'value' + ind;
	    }, argLength);

	    let argumentValues = R.map(function(name) {
		return ds[name];
	    }, argumentNames);

	    hyd = AllExports[ds.cons].create.apply(null, argumentValues);
	} else if(ds.cons == 'Object') {
	    hyd = R.clone(ds.data);
	    return hyd;
	}

	R.forEach(function(key) {
	    if(key !== 'cons') {
		hyd[key] = deserialize(ds[key], hyd[key]);
	    }
	}, R.keys(ds));
    } else {
	return hyd;
    }

    return hyd;
};


// Given a purescript DS, convert it into a form that can be used to easily construct
// the original type based on data constructors available on OutputExports.js
function serialize(ds) {
    let serial = {};
    if((typeof ds == "object") && (!('constructor' in ds) || ds.constructor.name == 'Object')) {
	serial.leaf = true;
	serial.cons = 'Object';
	// Clone the datastructure to prevent circular dependencies
	serial.data = R.clone(ds);
	
	return serial;
    } else if((typeof ds == 'function') && ds.name && AllExports.hasOwnProperty(ds.name)) {
	serial.cons = 'Function';
	serial.name = ds.name;
	return serial;
    } else if(typeof ds != "object"){
	return serial;
    }

    let constructorName = ds.constructor.name;
    serial.cons = constructorName;

    let valueKeys = R.times(function (ind) {
	return 'value' + ind;
    }, ds.constructor.length);

    R.forEach(function (key) {
	if(typeof ds[key] == 'function') {
	    serial[key] = {cons: 'Function', name: ds[key].name};
	} else {
	    serial[key] = ds[key];
	}
    }, valueKeys);

    R.forEach(function(key) {
	serial[key] = serialize(ds[key]);
    }, valueKeys);

    return serial;
};

module.exports = { serialize, deserialize };
