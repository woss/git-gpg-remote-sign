const path = require("path");
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.base.cjs')
const webpack = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");

const config = {
  entry: {
    signer: "./src/signer.ts"
  },
  output: {
    // library: 'signer',
    // libraryTarget: 'umd',
    path: path.resolve(__dirname, "../dist/signer"),
    // filename: '[name].js',
    clean: true,
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true,
    }),
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, "./dist.package.json"), to: "package.json" },
        { from: path.resolve(__dirname, "../src/signerExecutable.sh"), to: "signer.sh" },
      ],
    }),
  ],
  optimization: {
    minimize: false,
  },
  externalsPresets: {
    node: true,
  },
};

module.exports = merge(config, baseConfig);