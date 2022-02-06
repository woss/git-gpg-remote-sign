const path = require("path");
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack/webpack.config.base.cjs')
const CopyPlugin = require("copy-webpack-plugin");

const config = {
	entry: {
		signer: "./src/signer.ts",
		server: "./src/server.ts"
	},
	output: {
		path: path.resolve(__dirname, "./dist/all"),
		clean: true,
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: path.resolve(__dirname, "./webpack/dist.package.json"), to: "package.json" },
			],
		}),
	]
};
module.exports = merge(config, baseConfig);