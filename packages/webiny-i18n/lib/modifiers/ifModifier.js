"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    name: "if",
    execute(value, parameters) {
        return value === parameters[0] ? parameters[1] : parameters[2] || "";
    }
};
//# sourceMappingURL=ifModifier.js.map
