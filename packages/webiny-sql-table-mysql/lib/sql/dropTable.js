"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = table => {
    return `DROP TABLE IF EXISTS \`${table.getName()}\`;`;
};
//# sourceMappingURL=dropTable.js.map
