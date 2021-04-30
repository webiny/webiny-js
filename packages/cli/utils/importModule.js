const fs = require("fs");
const path = require("path");
const vm = require("vm");

/**
 * Add support for TS
 */
require.extensions[".ts"] = module => {
    const ts = require("typescript");
    const { outputText } = ts.transpileModule(fs.readFileSync(module.filename, "utf8"), {
        compilerOptions: {
            target: "es6",
            allowJs: true,
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            outDir: "bin",
            moduleResolution: "node",
            module: "commonjs"
        }
    });

    const context = Object.assign({}, global);
    context.require = module.require.bind(module);
    context.exports = module.exports;
    context.__filename = path.basename(module.filename);
    context.__dirname = path.dirname(module.filename);
    context.module = module;
    context.process = process;
    context.global = context;
    context.console = console;

    return vm.runInNewContext(outputText, vm.createContext(context));
};

module.exports.importModule = configPath => {
    if (!fs.existsSync(configPath)) {
        throw Error(`"${configPath}" does not exist!`);
    }

    const extension = path.extname(configPath);
    if (extension === ".ts") {
        return require(configPath).default;
    } else {
        return require(configPath);
    }
};
