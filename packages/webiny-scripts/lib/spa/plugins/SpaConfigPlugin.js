"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

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
                        window.webpackManifest = ${(0, _stringify2.default)(chunksManifest)};
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

exports.default = SpaConfigPlugin;
//# sourceMappingURL=SpaConfigPlugin.js.map
