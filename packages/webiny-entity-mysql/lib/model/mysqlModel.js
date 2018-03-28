"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyEntity = require("webiny-entity");

var _mysqlAttributesContainer = require("./mysqlAttributesContainer");

var _mysqlAttributesContainer2 = _interopRequireDefault(_mysqlAttributesContainer);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class MySQLModel extends _webinyEntity.EntityModel {
    createAttributesContainer() {
        return new _mysqlAttributesContainer2.default(this);
    }
}

exports.default = MySQLModel;
//# sourceMappingURL=mysqlModel.js.map
