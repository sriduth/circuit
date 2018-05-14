var axios = require('axios');

// TODO : Fix this
exports["callRPC"] = function (rpcCallSpec) {
    return function () {
	axios.post(rpcCallSpec.endpoint, rpcCallSpec['args'])
	    .then(function (response) {
		console.log(response);
		rpcCallSpec.successCallback(response.data)();
	    })
	    .catch(function (error) {
		console.log(error);
		rpcCallSpec.errorCallback()();
	    });
    };
};
