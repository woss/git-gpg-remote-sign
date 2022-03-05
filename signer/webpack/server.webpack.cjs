const path = require('path');
const baseConfig = require('./webpack.config.base.cjs');
const { merge } = require('webpack-merge');

const config = {
	entry: {
		server: './src/server.ts',
	},
	output: {
		path: path.resolve(__dirname, '../dist/server'),
		// clean: true,
	},
	optimization: {
		minimize: false,
	},
	// externals: ["node:fs", "node:zlib"],
	externalsPresets: {
		node: true,
	},
};

module.exports = merge(config, baseConfig);
