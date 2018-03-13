import crypto from "crypto";

class ModuleIds {
    apply(compiler) {
        compiler.plugin("compilation", compilation => {
            compilation.plugin("before-module-ids", modules => {
                modules.forEach(module => {
                    if ((!module.id || module.id.length !== 10) && module.libIdent) {
                        module.id = crypto
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

export default ModuleIds;
