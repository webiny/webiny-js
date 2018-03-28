"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

var _ = require("./../");

class Roles extends _webinyApi.EntityEndpoint {
    getEntityClass() {
        return _.Role;
    }
}

Roles.classId = "Security.Roles";
Roles.version = "1.0.0";

exports.default = Roles;
//# sourceMappingURL=roles.js.map
