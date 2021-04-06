const base = require("../../jest.config.base");
const items = require("@webiny/project-utils/testing/presets")([
    "@webiny/api-headless-cms",
    "storage-operations"
]);

module.exports = items.map(item => {
    //let beforeBuildResults = {};
    // before build
    //if (item.beforeBuild) {
    //	beforeBuildResults = item.beforeBuild(item);
    //	if (beforeBuildResults instanceof Promise) {
    //		throw new Error(`Cannot have async (Promise) in the beforeBuild of package "${item.name}" tests setup.`);
    //	} else if (beforeBuildResults && typeof beforeBuildResults !== "object") {
    //		throw new Error(`Cannot return anything but a plain object in the beforeBuild of package "${item.name}" tests setup.`);
    //	}
    //}
    return {
        ...base({ path: __dirname }, item.presets),
        name: item.name,
        displayName: item.name
        //...(beforeBuildResults || {}),
    };
});
