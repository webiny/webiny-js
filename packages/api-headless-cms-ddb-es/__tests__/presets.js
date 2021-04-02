const path = require("path");
const os = require("os");
const dynamoDbPreset = require("jest-dynalite/jest-preset");
const esPreset = os.platform() === "win32" ? {} : require("@shelf/jest-elasticsearch/jest-preset");


const isLocalElastic = !!process.env.LOCAL_ELASTICSEARCH;

const presets = [
	dynamoDbPreset,
	isLocalElastic ? {} : esPreset,
	{
		testEnvironment: path.resolve(__dirname, "environment.js"),
	}
]

module.exports = presets;