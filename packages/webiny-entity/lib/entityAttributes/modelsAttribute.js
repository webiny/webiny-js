"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyModel = require("webiny-model");

class ModelsAttribute extends _webinyModel.ModelsAttribute {
    getModelInstance() {
        const parentEntity = this.getParentModel().getParentEntity();
        const modelClass = this.getModelClass();
        return new modelClass({ parentEntity });
    }
}
exports.default = ModelsAttribute;
//# sourceMappingURL=modelsAttribute.js.map
