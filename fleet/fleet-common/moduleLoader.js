const Module = require('module');
const R = require('ramda');
const C = require('colors/safe');


/*
  Module loader override that replaces the returned implementation to effectively replace
  implementation for a proxy.
*/
const overrideModuleLoader = (currentModule, modules) => {
    let originalRequire = Module.prototype.require;
    modules = R.map((mod) => mod.name, modules);
    
    Module.prototype.require = function(module, opts) {
	let modulePath = module.split('/')
	let moduleName = modulePath[modulePath.length - 1];
	
	let path;

	if(opts && opts.loadOriginal) {
	    console.log(C.red(`ModuleLoader ::: ${currentModule} Loading original impementation for ${module}`))
	    path = module;
	} else {
	    if(R.contains(moduleName, modules) && moduleName != currentModule) {
		console.log(C.blue(`ModuleLoader :::  ${currentModule} Loading mocks for ${module}`));
		
		if(modulePath.length == 3){
		    path = `./mocks/${moduleName}/${moduleName}.js`;
		} else {
		    path = `../../mocks/${moduleName}/${moduleName}.js`;
		}
	    } else {
		path = module;
	    }
	}
	
	return originalRequire.apply(this, [path]);
    };
    
};

module.exports = { overrideModuleLoader };
