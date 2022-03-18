/* eslint-disable */
"use strict";
var __read =
    (this && this.__read) ||
    function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) {
            return o;
        }
        var i = m.call(o),
            r,
            ar = [],
            e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) {
                ar.push(r.value);
            }
        } catch (error) {
            e = { error: error };
        } finally {
            try {
                if (r && !r.done && (m = i["return"])) {
                    m.call(i);
                }
            } finally {
                if (e) {
                    throw e.error;
                }
            }
        }
        return ar;
    };
var __importStar =
    (this && this.__importStar) ||
    function (mod) {
        if (mod && mod.__esModule) {
            return mod;
        }
        var result = {};
        if (mod != null) {
            for (var k in mod) {
                if (Object.hasOwnProperty.call(mod, k)) {
                    result[k] = mod[k];
                }
            }
        }
        result["default"] = mod;
        return result;
    };
Object.defineProperty(exports, "__esModule", { value: true });
/* istanbul ignore file */
var react_1 = require("react");
var knobTypes = __importStar(require("@storybook/addon-knobs"));
exports.useKnob = function (knobType, name, defaultValue) {
    var knobFunc = knobTypes[knobType];
    var _a = __read(react_1.useState(defaultValue), 2),
        stateValue = _a[0],
        stateSetter = _a[1];
    var knobValue = knobFunc(name, stateValue);
    if (knobValue !== stateValue) {
        stateSetter(knobValue);
    }
    return [stateValue, stateSetter];
};
