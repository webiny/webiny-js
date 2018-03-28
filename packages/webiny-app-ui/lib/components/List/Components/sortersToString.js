"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = function(sorters) {
    var sort = [];
    (0, _each3.default)(sorters, function(value, field) {
        if (value === 1) {
            sort.push(field);
        } else {
            sort.push("-" + field);
        }
    });

    return sort.length ? sort.join(",") : null;
};
//# sourceMappingURL=sortersToString.js.map
