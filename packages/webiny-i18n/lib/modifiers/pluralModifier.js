"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    name: "plural",
    execute(value, parameters) {
        // Numbers can be single number or ranges.
        for (let i = 0; i < parameters.length; i = i + 2) {
            const current = parameters[i];
            if (current === "default") {
                return parameters[i + 1];
            }

            const numbers = current.split("-");

            // If we are dealing with a numbers range, then let's check if we are in it.
            if (numbers.length === 2) {
                if (value >= numbers[0] && value <= numbers[1]) {
                    return parameters[i + 1];
                }
                continue;
            }

            if (String(value) === numbers[0]) {
                return parameters[i + 1];
            }
        }

        return "";
    }
};
//# sourceMappingURL=pluralModifier.js.map
