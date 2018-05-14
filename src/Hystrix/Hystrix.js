var R = require('ramda');

exports["canCallFunction"] = function (invocationData) {
    //console.log('HYSTRIX: canCallFunction?', invocationData);
    return false;
};

exports["wrapServiceCall"] = (function () {
    var successCbWrapper = function (successCb) {
	return successCb;
    };

    var errorCbWrapper = function (errorCb) {
	return errorCb;
    };
    
    return R.curry(function (errorCb, successCb) {
	return {
	    wrappedSuccessCallback: successCbWrapper(successCb),
	    wrappedErrorCallback: errorCbWrapper(errorCb)
	};
    });
})();
