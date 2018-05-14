exports["getFunctionName"] = function (func) {
    return func.name || 'anonymous';
};

exports["getTimestamp"] = function () {
    return Date.now();
};

exports["increment"] = function (functionName) {
    console.log(functionName, '+1');
    return 
};

exports["latency"] = function (functionName) {
    return function(latency) {
	console.log(functionName, 'took', latency);
	return;
    }
};
