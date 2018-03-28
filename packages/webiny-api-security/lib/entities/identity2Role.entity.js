"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Identity2Role = undefined;

var _webinyApi = require("webiny-api");

var _role = require("./role.entity");

var _role2 = _interopRequireDefault(_role);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Identity2Role extends _webinyApi.Entity {
    constructor() {
        super();
        this.attr("identity").identity({ classIdAttribute: "identityClassId" });
        this.attr("identityClassId").char();

        this.attr("role").entity(_role2.default);
    }
}

exports.Identity2Role = Identity2Role;
Identity2Role.classId = "Security.Identity2Role";
Identity2Role.tableName = "Security_Identity2Role";

exports.default = Identity2Role;
//# sourceMappingURL=identity2Role.entity.js.map
