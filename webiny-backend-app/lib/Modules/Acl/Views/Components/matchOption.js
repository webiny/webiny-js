"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

/**
 * Common function for matching classes and classIds in entity/service modal dialog
 */
exports.default = function(_ref) {
    var term = _ref.term,
        option = _ref.option;

    var found = false;
    var data = option.data;

    if (data.classId.toLowerCase().includes(term.toLowerCase())) {
        found = true;
    }

    if (data.class.toLowerCase().includes(term.toLowerCase())) {
        found = true;
    }

    if (found) {
        return option;
    }

    return null;
};
//# sourceMappingURL=matchOption.js.map
