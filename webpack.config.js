const path = require('path');
//const WebpackShellPlugin = require('webpack-shell-plugin');
const webpack = require('webpack');
const WebpackShellPlugin = require('webpack-shell-plugin');

const plugins = [
  new WebpackShellPlugin({
    onBuildStart: 'sh ./build/prebuild.sh'
  })
];
//plugins.push(new webpack.optimize.UglifyJsPlugin({ output: {comments: false} }));
// plugins.push(new WebpackShellPlugin({
//  onBuildStart: ['echo "Starting"'],
//  onBuildEnd: ['./uploadFile.sh']
// }));


const mocks =  __dirname + "/build/Mocks.js";

module.exports = [{
  devtool: "source-map",
  entry: ["./index.js"],
  output: {
    path: __dirname + "/dist",
    filename: "index_bundle.js",
    publicPath: '/dist/',
    sourceMapFilename: "index_bundle.js.map"
  },
  plugins: plugins,
  module: {
    loaders: []
  },
  resolve: {
    alias: {
      express: mocks,
      "body-parser": mocks,
      "uuid": mocks,
      "colors/safe": mocks
    }
  }
}];
