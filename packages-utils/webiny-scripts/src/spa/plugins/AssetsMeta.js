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

            compilation.chunks.forEach(chunk => {
                chunk.files.forEach(file => {
                    // Don't add hot updates to meta
                    if (file.indexOf("hot-update") >= 0) {
                        return;
                    }

                    // Only store chunks map
                    if (file.startsWith("chunks/")) {
                        meta.chunks[chunk.id] = urlGenerator.generate(file);
                    }
                });
            });

            const json = JSON.stringify(meta, null, 2);

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
            compilation.plugin(
                "html-webpack-plugin-before-html-processing",
                (htmlPluginData, callback) => {
                    const { js, css } = htmlPluginData.assets;
                    htmlPluginData.assets.js = js.map(file => urlGenerator.generate(file));
                    htmlPluginData.assets.css = css.map(file => urlGenerator.generate(file));

                    callback(null, htmlPluginData);
                }
            );
        });
    }
}

module.exports = AssetsMeta;
