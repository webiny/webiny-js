"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

var _ = require("./../");

class Permissions extends _webinyApi.EntityEndpoint {
    getEntityClass() {
        return _.Permission;
    }
}

Permissions.classId = "Security.Permissions";
Permissions.version = "1.0.0";

exports.default = Permissions;
//# sourceMappingURL=permissions.js.map
