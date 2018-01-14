class DllBootstrapPlugin {
    constructor(options) {
        this.options = options || {}
    }

    apply(compiler) {
        compiler.plugin('compilation', (compilation) => {
            compilation.mainTemplate.plugin('startup', (source, chunk) => {
                const bootstrapEntry = this.options.module;
                const module = chunk.mapModules(m => m).find(m => m.rawRequest === bootstrapEntry);
                if (module) {
                    source = `__webpack_require__("${module.id}");\n${source}`;
                }

                return source;
            })
        })
    }
}

export default DllBootstrapPlugin;