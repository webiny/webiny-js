const fs = require("fs");
const path = require("path");
const tsnode = require("ts-node");

// Register ts-node to support running typescript files from CLI
tsnode.register({
    compilerOptions: {
        target: "es6",
        allowJs: true,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        moduleResolution: "node",
        module: "commonjs"
    }
});

module.exports.importModule = configPath => {
    if (!fs.existsSync(configPath)) {
        throw Error(`"${configPath}" does not exist!`);
    }

    const extension = path.extname(configPath);
    const importedModule = require(configPath);

    if (extension === ".ts") {
        return importedModule.default || importedModule;
    } else {
        return importedModule;
    }
};
