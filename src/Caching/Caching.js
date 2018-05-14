var cache = {};

exports["generateKeyFromArgs"] = function (args) {
    var key = "";
    
    for(var i = 0; i<args.length; i=i+1) {
	key += args[i];
    }

    return key;
};

exports["storeValue"] = function (key) {
    return function(value) {
	console.log('storing value in cache key:', key, value);

	cache[key] = {
	    value: value,
	    expires: Date.now() + 1000000
	};

	return value;
    };
};


exports["getValue"] = function (key) {
    var val = cache[key];
    
    console.log('getting value from cache', key, val);
    
    if(val) {
	return {
	    value: val.value,
	    isOk: true
	};
    } else {
	return {
	    value: null,
	    isOk: false
	};
    }
    
};
