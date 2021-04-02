const base = require("../../jest.config.base");
const packagesPresets = require("./__tests__/packagesPresets")(process.env.STORAGE_OPERATIONS_FILTER);

console.log(packagesPresets);
module.exports = packagesPresets.map(presets => {
	return {
		...base({ path: __dirname }, presets),
	};
});
