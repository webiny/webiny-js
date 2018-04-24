import findUp from "findup-sync";

class SpaConfigPlugin {
    constructor(options) {
        this.options = options;
    }

    apply(compiler) {
        compiler.plugin("compilation", compilation => {
            compilation.plugin(
                "html-webpack-plugin-before-html-processing",
                (htmlPluginData, callback) => {
                    htmlPluginData.assets.js.unshift(
                        findUp("vendor*.dll.js", {
                            cwd: compiler.options.output.path,
                            matchBase: true
                        }).replace(compiler.options.output.path, "")
                    );
                    const chunksManifest = JSON.parse(compilation.assets["meta.json"].source())
                        .chunks;

                    const config = `
                    <script type="text/javascript"> 
                        window.webpackManifest = ${JSON.stringify(
                            chunksManifest[htmlPluginData.plugin.options.name],
                            null,
                            2
                        )};
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
