const webpack = require('webpack');
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

// const nodeExternals = require('webpack-node-externals');

const isProduction = process.env.NODE_ENV == "production";

const config = {
  entry: {
    server:"./src/server.ts",
    signer:"./src/signer.ts"
  },
  output: {
    // library: 'signer',
    // libraryTarget: 'umd',
    path: path.resolve(__dirname, "dist"),
    filename: '[name].js',
    clean: true,
  },
  target: 'node', // in order to ignore built-in modules like path, fs, etc.
  // externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
  plugins: [
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true,
    }),
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, "./dist.package.json"), to: "package.json" },
      ],
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    // rules: [
    //   {
    //     test: /\.(js|jsx)$/i,
    //     loader: "babel-loader",
    //   },
    // ],
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
