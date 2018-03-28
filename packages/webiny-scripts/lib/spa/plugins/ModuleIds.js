"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _crypto = require("crypto");

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class ModuleIds {
    apply(compiler) {
        compiler.plugin("compilation", compilation => {
            compilation.plugin("before-module-ids", modules => {
                modules.forEach(module => {
                    if ((!module.id || module.id.length !== 10) && module.libIdent) {
                        module.id = _crypto2.default
                            .createHash("md5")
                            .update(
                                module.libIdent({
                                    context: compiler.options.context
                                })
                            )
                            .digest("hex")
                            .substr(0, 10);
                    }
                });
            });
        });
    }
}

exports.default = ModuleIds;
//# sourceMappingURL=ModuleIds.js.map
