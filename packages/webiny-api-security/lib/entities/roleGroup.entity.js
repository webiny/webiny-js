"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

var _role = require("./role.entity");

var _role2 = _interopRequireDefault(_role);

var _role2RoleGroup = require("./role2RoleGroup.entity");

var _role2RoleGroup2 = _interopRequireDefault(_role2RoleGroup);

var _nameSlugDesc = require("./helpers/nameSlugDesc");

var _nameSlugDesc2 = _interopRequireDefault(_nameSlugDesc);

var _onSetFactory = require("./helpers/onSetFactory");

var _onSetFactory2 = _interopRequireDefault(_onSetFactory);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class RoleGroup extends _webinyApi.Entity {
    constructor() {
        super();
        (0, _nameSlugDesc2.default)(this);
        this.attr("roles")
            .entities(_role2.default)
            .setUsing(_role2RoleGroup2.default)
            .onGet((0, _onSetFactory2.default)(_role2.default));
    }
}

RoleGroup.classId = "Security.RoleGroup";
RoleGroup.tableName = "Security_RoleGroups";

exports.default = RoleGroup;
//# sourceMappingURL=roleGroup.entity.js.map
