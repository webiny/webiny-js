"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = table => {
    return `TRUNCATE TABLE \`${table.getName()}\`;`;
};
//# sourceMappingURL=truncateTable.js.map
