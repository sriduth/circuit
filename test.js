// var a = require('./mocks/ServiceComm/ServiceComm')
// var e = require('./output/Data.Either')
// var async = require('asyncawait/async')
// var await = require('asyncawait/await')
// var R = require('ramda');
// var b = async(() => {
//     console.log('called');
//     let r = a.callAllFunctions(e.Right.create(""));
//     console.log(r);
// });

// b();

// R.times((arg) => {
//     console.log(arg);
//     b();
// }, 1000);

const r = require('./output/Main/index.js')
r.main();
