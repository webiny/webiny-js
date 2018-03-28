"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

var _ = require("./../");

class Users extends _webinyApi.EntityEndpoint {
    getEntityClass() {
        return _.User;
    }
}

Users.classId = "Security.Users";
Users.version = "1.0.0";

exports.default = Users;
//# sourceMappingURL=users.js.map
