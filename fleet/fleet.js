const yaml = require('js-yaml');
const fs   = require('fs');
const path = require('path');
const R = require('ramda');
const C = require('colors/safe');
const changeCase = require('change-case');

const { argCount } = require('./fleet-common/utils');

const serverTemplate = (apiSpec, allApis, valueEndpoints, applicationSpec) => `
let {overrideModuleLoader: moduleLoader} = require('../../fleet/fleet-common/moduleLoader');
moduleLoader('${apiSpec.name}', ${JSON.stringify(allApis, null, 4)});

const { startServer } = require('../../fleet/fleet-common/apiServer');

startServer(
  ${JSON.stringify(valueEndpoints)}, 
  ${JSON.stringify(apiSpec, null, 2)},
  './output/${apiSpec.name}', 
  '${apiSpec.configuration.host}',
   ${apiSpec.configuration.port},
  '${applicationSpec.application}');`;

const mockTemplate = (apiSpec, argCount, method) => `
exports["${method}"] = async.result(R.curryN( ${argCount}, (...args) => {
   //client.increment("${method}");
   
   args = R.map((arg) => {
	const { serialize } = require('../../fleet/fleet-common/serialization')
        return serialize(arg);
    }, args);
    
    let response = await(socketClient.send(${JSON.stringify(apiSpec)}, '${method}', args));
    
    const { deserialize } = require('../../fleet/fleet-common/serialization')
    response = deserialize(response, {});
    
    return response;
}));`;

const valueMockTemplate =
      (apiSpec, method) => `exports["${method}"] = require('../../output/${apiSpec.name}', {loadOriginal: true})["${method}"];`


const ensureDirectoryExistence = (filePath) => {
    let dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
	return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
};

let dockerfileTemplate = (service, port) => `
FROM fleet-base
EXPOSE ${port}
CMD node /srv/app/servers/${service}/${service}.js
`;

const generateDockerFile = (apiSpec) => {
    let dockerfilePath = `./_deploy/${apiSpec.name}/Dockerfile`;
    
    ensureDirectoryExistence(dockerfilePath);
    fs.writeFileSync(dockerfilePath, dockerfileTemplate(apiSpec.name,
					apiSpec.configuration.port));
};

const generateDeploymentShellScript = (applicationSpec) => {
    let contents = [
	'#!/bin/bash',
	'docker build -t fleet-base .',
	R.map((apiSpec) => {
	    let imageName = changeCase.snakeCase(apiSpec.name);
	    let serviceName = imageName.split('_').join('-');

	    return `docker build -t ${imageName} - < _deploy/${apiSpec.name}/Dockerfile`; 
	}, applicationSpec.services),
	'kubectl apply -f _deploy/util-services.yaml',
	'kubectl apply -f _deploy/deployment-spec.yaml'
    ];

    contents = R.flatten(contents);
    contents = contents.join('\n');

    let deploymentShellScriptName = 'deploy-all.sh';
    ensureDirectoryExistence(deploymentShellScriptName);
    fs.writeFileSync(deploymentShellScriptName, contents);
};

const generateUtilityServicesDeployment = (applicationSpec) => {
    let utilityServices = [{
	name: 'grafana',
	image: 'grafana/grafana',
	ports: [{port: 3000, protocol: 'TCP'}]
    }, {
	name: 'influxdb',
	image: 'library/influxdb',
	ports: [{port: 8086, protocol: 'TCP'}]
    }, {
	name: 'telegraf',
	image: 'telegraf',
	ports: [{ 
	    port: 8125,
	    protocol: 'UDP'
	}, { 
	    port: 8092,
	    protocol: 'UDP'
	}, {
	    port: 8094,
	    protocol: 'TCP'
	}]
    }];

    let utilServiceDeployments = R.map((utilSpec) => {
	let name = `${applicationSpec.application}-${utilSpec.name}`;
    
	return [{
	    apiVersion: 'apps/v1',
	    kind: 'Deployment',
	    metadata: {
		name: name
	    },
	    spec: {
		selector: {
		    matchLabels: {
			app: name
		    }
		},
		replicas: 1,
		template: {
		    metadata: {
			labels: {
			    app: name
			}
		    },
		    spec: {
			containers: [{
			    name: name,
			    image: utilSpec.image,
			    imagePullPolicy: 'Never',
			    ports: R.map((port) =>  {
				return { containerPort: port.port,
					 name: `svc-${port.port}-${port.protocol.toLowerCase()}`};
			    }, utilSpec.ports)
			}]
		    }
		}
	    }
	}, {
	    apiVersion: 'v1',
	    kind: 'Service',
	    metadata: {
		name: name
	    },
	    spec: {
		selector: {
		    app: name
		},
		ports: R.map((portSpec) => {
		    return {
			protocol: portSpec.protocol,
			port: portSpec.port,
			name: `svc-${portSpec.port}-${portSpec.protocol.toLowerCase()}`
		    };
		}, utilSpec.ports)
	    }
	}]
    }, utilityServices);

    utilServiceDeployments = R.flatten(utilServiceDeployments);

    utilServiceDeployments = R.map(yaml.safeDump, utilServiceDeployments);
    
    utilServiceDeployments = utilServiceDeployments.join('\n---\n\n');
    
    let deploymentSpecFileName = '_deploy/util-services.yaml';
    ensureDirectoryExistence(deploymentSpecFileName);
    fs.writeFileSync(deploymentSpecFileName, utilServiceDeployments);
};

const generateApplicationDeployment = (applicationSpec) => {
    let getSpec = (services) => {
	return R.map((service) => {
	    let imageName = changeCase.snakeCase(service.name);
	    let serviceName = imageName.split('_').join('-');
	    
	    return {
		name: serviceName,
		imagePullPolicy: 'Never',
		image: imageName,
		ports: [{
		    containerPort: service.configuration.port
		}]
	    }
	}, services);
    };
    
    let deploymentSpec =  {
	apiVersion: 'apps/v1',
	kind: 'Deployment',
	metadata: {
	    name: applicationSpec.application
	},
	spec: {
	    selector: {
		matchLabels: {
		    app: applicationSpec.application
		}
	    },

	    replicas: 1,
	    template: {
		metadata: {
		    labels: {
			app: applicationSpec.application
		    }
		},
		spec: {
		    containers: getSpec(applicationSpec.services)
		}
	    }
	}
    };

    deploymentSpec = yaml.safeDump(deploymentSpec);
    let deploymentSpecFileName = '_deploy/deployment-spec.yaml';
    ensureDirectoryExistence(deploymentSpecFileName);
    fs.writeFileSync(deploymentSpecFileName, deploymentSpec);
};

const generateApiServer = (apiSpec, allApis, applicationSpec) => {
    let apiModule = require(path.resolve(`./output/${apiSpec.name}`));

    let apiServer = () => {
	let valueEndpoints = [];
	
	for(let method in apiModule) {
	    let { type, value } = argCount(apiModule[method]);
	    if(type == 'value') {
		valueEndpoints.push(method);
	    }
	}

	return serverTemplate(apiSpec, allApis, valueEndpoints, applicationSpec);
    };

    let apiServerPath = `./servers/${apiSpec.name}/${apiSpec.name}.js`;
    ensureDirectoryExistence(apiServerPath);
    fs.writeFileSync(apiServerPath, apiServer());

    let generateMock = () => {
	let mocks = [`const axios = require('axios');`,
		     `const R = require('ramda');`,
		     `const StatsD = require('hot-shots');`,
		     `//const client = new StatsD({host: "${applicationSpec.application}-telegraf", prefix: "${apiSpec.name}_client."});`,
		     `const socketClient = require('../../fleet/fleet-common/socketClient');`,
		     `socketClient.prepareClient(${JSON.stringify(apiSpec)})`,
		     `const async = require('asyncawait/async');`,
		     `const await = require('asyncawait/await')`];

	for(let method in apiModule) {
	    let { type, value } = argCount(apiModule[method]);
	    if(type == 'value') {
		console.log(C.yellow(`MockGenerator ::: ${apiSpec.name}.${method} is a value, replacing with value`));
		mocks.push(valueMockTemplate(apiSpec, method));
	    }

	    if(type == 'args') {	
		mocks.push(mockTemplate(apiSpec, value, method));
	    }
	}

	return mocks.join('\n');
    };


    let mockClientPath = `./mocks/${apiSpec.name}/${apiSpec.name}.js`; 
    ensureDirectoryExistence(mockClientPath);
    fs.writeFileSync(mockClientPath, generateMock());
};


const ArgumentParser = require('argparse').ArgumentParser;

const parser = (() => {
    let parser = new ArgumentParser({
	version: '0.1',
	addHelp: true,
	description: 'Deploy purescript modules as microservices in kubernetes'
    });
    
    parser.addArgument(['-f', '--file'], {
	required: true,
	help: 'path to deployment-spec.yaml'
    });
    
    parser.addArgument(['-g', '--create-master-exports'], {
	help: 'Generates the OutputExports.js file',
	action: 'storeTrue'
    });

    return parser;
})();

let args = parser.parseArgs();

if(args.create_master_exports) {
    let createMasterExports = require('./createMasterExports');
    createMasterExports();
}


// Get document, or throw exception on error
try {
    let applicationSpec = yaml.safeLoadAll(fs.readFileSync(path.resolve(args.file), 'utf8'));

    applicationSpec = applicationSpec[0];
    
    let documents = applicationSpec.services;
    
    for(let document of documents) {
	if (document.type == "api") {
	    generateApiServer(document, documents, applicationSpec);
	    generateDockerFile(document);
	}	
    }

    generateApplicationDeployment(applicationSpec);
    generateUtilityServicesDeployment(applicationSpec);
    generateDeploymentShellScript(applicationSpec);
} catch (e) {
    console.log(e);
}
