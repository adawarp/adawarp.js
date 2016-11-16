"use strict";
const webpack = require('webpack');

const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  console.log("production build");
}

module.exports = {
  entry: { 
   adawarp:'./src/Peer.ts', 
   test: './src/TestManifest.ts'
  },
  cache: true,
  output: {
    path: './dist/',
    filename: '[name].js'
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  devtool: isProduction ? "" : "inline-source-map",
  module: {
    preLoaders: isProduction ? [] : [
      { test: /\.tsx?$/, loader: 'tslint-loader', exclude: /node_modules/ }
    ],
    loaders: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
      { test: /\.jade$/, loader: 'jade-loader' },
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file" },
      { test: /\.(woff|woff2)$/, loader:"url?prefix=font/&limit=5000" },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/octet-stream" },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=image/svg+xml" }
    ]
  }
}
