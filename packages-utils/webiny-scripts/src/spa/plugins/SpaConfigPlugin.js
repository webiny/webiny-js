class SpaConfigPlugin {
    constructor(options) {
        this.options = options;
    }

    apply(compiler) {
        compiler.plugin("compilation", compilation => {
            compilation.plugin(
                "html-webpack-plugin-before-html-processing",
                (htmlPluginData, callback) => {
                    const chunksManifest = JSON.parse(compilation.assets["meta.json"].source())
                        .chunks;

                    const config = `
                    <script type="text/javascript"> 
                        var webinyConfig = ${JSON.stringify(
                            this.options[htmlPluginData.plugin.options.name]
                        )};
                        window.webpackManifest = ${JSON.stringify(chunksManifest)};
                    </script>
                    </body>
                `;
                    htmlPluginData.html = htmlPluginData.html.replace("</body>", config);
                    callback(null, htmlPluginData);
                }
            );
        });
    }
}

export default SpaConfigPlugin;
