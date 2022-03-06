'use strict';

const webpack = require('webpack');
const path = require('path');

const nodeExternals = require('webpack-node-externals');

const isProduction = process.env.NODE_ENV == 'production';

const copyrightSnippet = `/**
* Daniel's  Remote signer for git commits
* Copyright (C) 2022 Daniel Maricic <https://woss.io>
* 
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
* 
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
* 
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/`;

console.log('Webpack is running in %s mode', process.env.NODE_ENV);

const config = {
	entry: {
		remote_signer_server: './src/index.ts',
	},
	output: {
		// library: 'signer',
		// libraryTarget: 'umd',
		path: path.resolve(__dirname, './dist'),
		filename: '[name].js',
		clean: true,
	},
	// the plugins are executed from last to first
	plugins: [
		new webpack.BannerPlugin({
			banner: copyrightSnippet,
			raw: true,
		}),
		new webpack.BannerPlugin({
			banner: '#!/usr/bin/env node',
			raw: true,
		}),
		new webpack.optimize.LimitChunkCountPlugin({
			maxChunks: 1,
		}),
	],
	mode: isProduction ? 'production' : 'development',
	target: 'node',
	optimization: {
		minimize: false,
	},
	externalsPresets: {
		node: true,
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							transpileOnly: true, // https://github.com/TypeStrong/ts-loader#transpileonly
						},
					},
				],
				exclude: /node_modules/,
			},
		],
	},
	devtool: 'source-map',
	ignoreWarnings: [(warning) => true],
};

module.exports = config;
