"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * AssetsMeta class generates a `meta.json` file containing chunks manifest and other entry points.
 * Chunks manifest is then included in the HTML file.
 */
class AssetsMeta {
    constructor(options) {
        this.options = options || {};
        this.manifestVariable = options.manifestVariable || "webpackManifest";
    }

    apply(compiler) {
        const outputName = "meta.json";
        const { urlGenerator } = this.options;

        compiler.plugin("emit", (compilation, compileCallback) => {
            this.compilation = compilation;
            let meta = {
                chunks: {}
            };

            const prefix = process.env.NODE_ENV === "development" ? "" : "/";

            compilation.chunks.forEach(chunk => {
                chunk.files.forEach(file => {
                    // Don't add hot updates to meta
                    if (file.indexOf("hot-update") >= 0) {
                        return;
                    }

                    // Only store chunks map
                    if (file.startsWith("chunks/")) {
                        meta.chunks[chunk.id] = urlGenerator.generate(file, prefix);
                    }
                });
            });

            const json = (0, _stringify2.default)(meta, null, 2);

            compilation.assets[outputName] = {
                source: () => json,
                size: () => json.length
            };

            compileCallback();
        });

        let oldChunkFilename;
        let manifestVariable = this.manifestVariable;

        compiler.plugin("this-compilation", function(compilation) {
            const mainTemplate = compilation.mainTemplate;
            mainTemplate.plugin("require-ensure", function(content) {
                const filename = this.outputOptions.chunkFilename || this.outputOptions.filename;

                if (filename) {
                    oldChunkFilename = this.outputOptions.chunkFilename;
                    this.outputOptions.chunkFilename = "__CHUNK_MANIFEST__";
                }

                return content;
            });
        });

        compiler.plugin("compilation", function(compilation) {
            // Replace placeholder with custom variable for manifest json
            compilation.mainTemplate.plugin("require-ensure", function(
                content,
                chunk,
                hash,
                chunkIdVar
            ) {
                if (oldChunkFilename) {
                    this.outputOptions.chunkFilename = oldChunkFilename;
                }

                return content.replace(
                    '"__CHUNK_MANIFEST__"',
                    manifestVariable + "[" + chunkIdVar + "]"
                );
            });

            /**
             * Generate proper URLs for assets that are injected in the HTML
             */
            const generateUrl = file => {
                return urlGenerator.generate(file.replace(compiler.options.output.publicPath, ""));
            };

            compilation.plugin("html-webpack-plugin-before-html-processing", function(
                htmlPluginData,
                callback
            ) {
                const { js, css } = htmlPluginData.assets;
                htmlPluginData.assets.js = js.map(generateUrl);
                htmlPluginData.assets.css = css.map(generateUrl);

                callback(null, htmlPluginData);
            });
        });
    }
}

exports.default = AssetsMeta;
//# sourceMappingURL=AssetsMeta.js.map
