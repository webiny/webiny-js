"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _identity = require("./identity.mysql");

var _identity2 = _interopRequireDefault(_identity);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class UserTable extends _identity2.default {
    constructor() {
        super();
        this.column("email")
            .char(50)
            .setNotNull();
        this.column("password")
            .char(60)
            .setNotNull();
        this.column("firstName").char(20);
        this.column("lastName").char(20);
        this.column("enabled")
            .smallInt(1)
            .setDefault(1);

        this.index().unique("email");
    }
}

UserTable.setName("Security_Users");

exports.default = UserTable;
//# sourceMappingURL=user.mysql.js.map
