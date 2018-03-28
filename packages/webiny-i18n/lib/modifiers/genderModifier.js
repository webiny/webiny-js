"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    name: "gender",
    execute(value, parameters) {
        return value === "male" ? parameters[0] : parameters[1];
    }
};
//# sourceMappingURL=genderModifier.js.map
