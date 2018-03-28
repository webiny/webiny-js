"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RuleModel = undefined;

var _webinyApi = require("webiny-api");

var _webinyModel = require("webiny-model");

var _role = require("./role.entity");

var _role2 = _interopRequireDefault(_role);

var _role2Permission = require("./role2Permission.entity");

var _role2Permission2 = _interopRequireDefault(_role2Permission);

var _nameSlugDesc = require("./helpers/nameSlugDesc");

var _nameSlugDesc2 = _interopRequireDefault(_nameSlugDesc);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Permission extends _webinyApi.Entity {
    constructor() {
        super();
        (0, _nameSlugDesc2.default)(this);
        this.attr("rules").models(RuleModel);
        this.attr("roles")
            .entities(_role2.default)
            .setUsing(_role2Permission2.default);
    }
}

Permission.classId = "Security.Permission";
Permission.tableName = "Security_Permissions";

exports.default = Permission;

// Local helper classes

class RuleMethodModel extends _webinyModel.Model {
    constructor() {
        super();
        this.attr("method")
            .char()
            .setValidators("required");
    }
}

RuleMethodModel.classId = "Security.RuleMethodModel";

class RuleModel extends _webinyModel.Model {
    constructor() {
        super();
        this.attr("classId")
            .char()
            .setValidators("required");
        this.attr("methods").models(RuleMethodModel);
    }
}

exports.RuleModel = RuleModel;
RuleModel.classId = "Security.RuleModel";
//# sourceMappingURL=permission.entity.js.map
