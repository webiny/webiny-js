const crypto = require("crypto");
const path = require("path");
const _ = require("lodash");
const NormalModule = require("webpack/lib/NormalModule");

class ChunkIds {
    constructor(options) {
        this.options = options || {};
    }

    apply(compiler) {
        this.compiler = compiler;
        compiler.plugin("compilation", compilation => {
            // Generate chunk IDs
            compilation.plugin("before-chunk-ids", chunks => {
                chunks.forEach((chunk, index) => {
                    if (!chunk.hasEntryModule() && chunk.id === null) {
                        if (process.env.NODE_ENV === "production") {
                            chunk.id = this.createChunkIdHash(chunk);
                        } else {
                            // ID must contain the name of the app to avoid ID clashes between multiple apps
                            chunk.id = "chunk-" + index;
                            // Name is only used in development for easier debugging
                            const chunkData = this.generateChunkName(chunk);
                            chunk.name = chunkData.unique
                                ? chunkData.name
                                : chunkData.name + "-" + index;
                        }
                    }
                });
            });
        });
    }

    generateChunkName(chunk) {
        if (chunk.filenameTemplate) {
            return { name: chunk.filenameTemplate.replace(".js", ""), unique: true };
        }
        const chunkModules = chunk
            .mapModules(m => m)
            .filter(this.filterJsModules)
            .sort(this.sortByIndex);
        const filteredModules = chunkModules.filter(m => !m.resource.includes("node_modules"));
        let chunkName = _.get(
            filteredModules,
            "[0].resource",
            _.get(chunkModules, "0.resource", "undefined")
        )
            .split(this.options.projectRoot + path.sep)
            .pop();
        chunkName = chunkName
            .replace(`${path.sep}index.js`, "")
            .replace(/\//g, "_")
            .replace(/\\/g, "_")
            .replace(/\.jsx?/, "");
        chunkName = chunkName
            .split("_")
            .slice(-3)
            .join("_");
        return { name: chunkName };
    }

    sortByIndex(a, b) {
        return a.index - b.index;
    }

    filterJsModules(m) {
        if (m instanceof NormalModule) {
            return m.resource.endsWith(".js") || m.resource.endsWith(".jsx");
        }

        return false;
    }

    createChunkIdHash(chunk) {
        // We are generating chunk id based on containing modules (their `resource` path relative to `Apps` folder).
        // That way chunk id does not change as long as it contains the same modules (no matter the content).
        const paths = chunk
            .mapModules(m => this.getRelativeModulePath(m))
            .sort((a, b) => a.index - b.index)
            .join("\n");
        return crypto
            .createHash("md5")
            .update(paths)
            .digest("hex")
            .substr(0, 10);
    }

    getRelativeModulePath(module) {
        if (!module || !module.resource) {
            return "";
        }

        return module.resource.split(this.options.projectRoot + path.sep).pop();
    }
}

module.exports = ChunkIds;
