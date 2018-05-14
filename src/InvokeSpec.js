const yaml = require('js-yaml');
const fs   = require('fs');
const R = require('ramda');
var InvokeSpec = null;

var getFnCallSpec = function (functionName) {
    InvokeSpec = InvokeSpec || require('./index');

    return function (moduleName) {
	var applicationSpec = yaml.safeLoadAll(fs.readFileSync('deployment-spec.yaml', 'utf8'))[0];

	// Get the module referred by the selector
	var module = R.find(function (moduleSpec) {
	    return moduleSpec.name == moduleName;   
	})(applicationSpec.services);

	if(!module) {
	    return [];
	}

	var findFunctionSpec = function (specs) {
	    return R.find(function(fn) {
		return Object.keys(fn)[0] == functionName;
	    })(specs);
	};
	
	var generateCachingSpec = function(allSpecs) {
	    var s = null;
	    var spec = findFunctionSpec(allSpecs);
	    if(spec) {
		s = {};
		s.cacheTime = spec[functionName].time;
	    }

	    return s;
	};


	var generateLoggingSpec = function (allSpecs) {
	    var s = null;
	    var spec = findFunctionSpec(allSpecs);
	    if(spec) {
		s = {};
		if(R.contains('papertrail', spec[functionName]['arguments'])) {
		    s['logArgs'] = true;
		}

		if(R.contains('papertrail', spec[functionName]['return'])) {
		    s['logReturn'] = true;
		}
	    }

	    return s;
	};

	var generateMetricsSpec = function(allSpecs) {
	    var s = null;
	    var spec = findFunctionSpec(allSpecs);

	    if(spec) {
		s = {};
		if(R.contains('counter', spec[functionName])) {
		    s.counter = true;
		}

		if(R.contains('latency', spec[functionName])) {
		    s.latency = true;
		}
	    }

	    return s;
	};

	var generateRPCSpec = function (allSpecs) {
	    var s = null;
	    var spec = findFunctionSpec(allSpecs);

	    if(spec) {
		s = {};
		s.endpoint = 'http://127.0.0.1';
	    }

	    return s;    
	};

	var generateHystrixSpec = function (allSpecs) {
	    var s = null;
	    var spec = findFunctionSpec(allSpecs);

	    if(spec) {
		s = {};
	    }

	    return s;
	};
	
	var spec = R.reduce(function (fnCallSpec, spec) {
	    var genSpec = null;
	    var cons = null;
	    var aspec = module[spec]
	    if(spec == 'caching') {
		cons = InvokeSpec.CachingSpec.create;
		genSpec = generateCachingSpec(aspec);
	    } else if(spec == 'logging') {
		cons = InvokeSpec.LoggingSpec.create;
		genSpec = generateLoggingSpec(aspec);
	    } else if(spec == 'metrics') {
		cons = InvokeSpec.MetricsSpec.create;
		genSpec = generateMetricsSpec(aspec);
	    } else if(spec == 'rpc') {
		cons = InvokeSpec.RPCSpec.create;
		genSpec = generateRPCSpec(aspec);
	    } else if(spec == 'hystrix') {
		cons = InvokeSpec.HystrixSpec.create;
		genSpec = generateHystrixSpec(aspec);
	    }

	    if(genSpec != null) {
		fnCallSpec.push(cons(genSpec));
	    }

	    return fnCallSpec;
	}, [], ['caching', 'logging', 'metrics', 'rpc', 'hystrix']);

	return spec;
    };
};

var getFunctionDetails = function(func) {
    return { functionName: func.name, moduleName: 'OrderService' };
}

exports["getFunctionDetails"] = getFunctionDetails;
exports["getFnCallSpec"] = getFnCallSpec;
