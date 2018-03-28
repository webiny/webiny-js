"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyModel = require("webiny-model");

var _entityAttributesContainer = require("./entityAttributesContainer");

var _entityAttributesContainer2 = _interopRequireDefault(_entityAttributesContainer);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class EntityModel extends _webinyModel.Model {
    constructor(params) {
        super(params);
        if (params && typeof params === "object") {
            this.setParentEntity(params.parentEntity);
        }
    }

    setParentEntity(parentEntity) {
        this.parentEntity = parentEntity;
        return this;
    }

    getParentEntity() {
        return this.parentEntity;
    }

    createAttributesContainer() {
        return new _entityAttributesContainer2.default(this);
    }
}

exports.default = EntityModel;
//# sourceMappingURL=entityModel.js.map
