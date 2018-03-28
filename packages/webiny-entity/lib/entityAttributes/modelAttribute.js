"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyModel = require("webiny-model");

class ModelAttribute extends _webinyModel.ModelAttribute {
    getAsync() {
        return true;
    }
    getModelInstance() {
        const parentEntity = this.getParentModel().getParentEntity();
        const modelClass = this.getModelClass();
        return new modelClass({ parentEntity });
    }
}
exports.default = ModelAttribute;
//# sourceMappingURL=modelAttribute.js.map
