const webpack = require('webpack');
const path = require("path");

const nodeExternals = require('webpack-node-externals');

const isProduction = process.env.NODE_ENV == "production";

const config = {
	mode: isProduction ? "production" : "development",
	target: 'node', // in order to ignore built-in modules like path, fs, etc.
	// externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
	plugins: [

		new webpack.optimize.LimitChunkCountPlugin({
			maxChunks: 1,
		}),
	],
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							transpileOnly: true
						}
					}
				],
				exclude: /node_modules/,

			},
		],
	},
	devtool: 'source-map',
};

module.exports = config
