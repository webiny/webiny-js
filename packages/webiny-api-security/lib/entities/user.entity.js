"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _identity = require("./identity.entity");

var _identity2 = _interopRequireDefault(_identity);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class User extends _identity2.default {
    constructor() {
        super();

        this.attr("email")
            .char()
            .setValidators("required,email")
            .onSet(value => value.toLowerCase().trim());

        this.attr("password").password();
        this.attr("firstName").char();
        this.attr("lastName").char();
        this.attr("gravatar").dynamic(() =>
            _promise2.default
                .resolve()
                .then(() => require("md5"))
                .then(md5 => md5(this.email))
        );
        this.attr("enabled")
            .boolean()
            .setDefaultValue(true);
        // TODO: 2FactorAuth
        // TODO: Password recovery
    }
}

User.classId = "Security.User";
User.tableName = "Security_Users";

exports.default = User;
//# sourceMappingURL=user.entity.js.map
