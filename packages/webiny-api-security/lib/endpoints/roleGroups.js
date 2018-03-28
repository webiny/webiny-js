"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

var _ = require("./../");

class RoleGroups extends _webinyApi.EntityEndpoint {
    getEntityClass() {
        return _.RoleGroup;
    }
}

RoleGroups.classId = "Security.RoleGroups";
RoleGroups.version = "1.0.0";

exports.default = RoleGroups;
//# sourceMappingURL=roleGroups.js.map
