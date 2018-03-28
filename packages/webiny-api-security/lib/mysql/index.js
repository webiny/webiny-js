"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _user = require("./user.mysql");

Object.defineProperty(exports, "UserTable", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_user).default;
    }
});

var _identity = require("./identity.mysql");

Object.defineProperty(exports, "IdentityTable", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_identity).default;
    }
});

var _identity2Role = require("./identity2Role.mysql");

Object.defineProperty(exports, "Identity2RoleTable", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_identity2Role).default;
    }
});

var _identity2RoleGroup = require("./identity2RoleGroup.mysql");

Object.defineProperty(exports, "Identity2RoleGroupTable", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_identity2RoleGroup).default;
    }
});

var _role = require("./role.mysql");

Object.defineProperty(exports, "RoleTable", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_role).default;
    }
});

var _roleGroup = require("./roleGroup.mysql");

Object.defineProperty(exports, "RoleGroupTable", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_roleGroup).default;
    }
});

var _permission = require("./permission.mysql");

Object.defineProperty(exports, "PermissionTable", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_permission).default;
    }
});

var _role2RoleGroup = require("./role2RoleGroup.mysql");

Object.defineProperty(exports, "Role2RoleGroupTable", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_role2RoleGroup).default;
    }
});

var _role2Permission = require("./role2Permission.mysql");

Object.defineProperty(exports, "Role2PermissionTable", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_role2Permission).default;
    }
});

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}
//# sourceMappingURL=index.js.map
