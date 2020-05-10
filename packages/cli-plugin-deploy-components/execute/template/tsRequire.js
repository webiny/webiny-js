const vm = require("vm");
const fs = require("fs");
const path = require("path");

const options = {
    projectRoot: null
};

module.exports = opts => {
    Object.assign(options, opts);
};

require.extensions[".ts"] = module => {
    const ts = require("typescript");
    const { outputText } = ts.transpileModule(fs.readFileSync(module.filename, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS }
    });

    const filename = path.basename(module.filename);
    const script = new vm.Script(outputText, {
        filename,
        lineOffset: 1,
        columnOffset: 1,
        displayErrors: true,
        timeout: 1000
    });

    const context = Object.assign({}, global);
    context.require = module.require.bind(module);
    context.exports = module.exports;
    context.__filename = filename;
    context.__dirname = path.dirname(module.filename);
    context.module = module;
    context.process = process;
    context.global = context;

    return script.runInNewContext(context);
};
