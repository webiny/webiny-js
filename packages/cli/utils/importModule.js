const fs = require("fs");
const path = require("path");
const { addHook } = require("pirates");

/**
 * Add support for TS
 */

addHook(
    code => {
        const ts = require("typescript");
        const { outputText } = ts.transpileModule(code, {
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

        return outputText;
    },
    {
        exts: [".ts"],
        matcher: () => true
    }
);

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
