"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _isEmpty2 = require("lodash/isEmpty");

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var length = function length(arr) {
    return arr.filter(function(v) {
        return !(0, _isEmpty3.default)(v);
    }).length;
};

exports.default = function(routes) {
    routes.sort(function(routeA, routeB) {
        // 1 means 'a' goes after 'b'
        // -1 means 'a' goes before 'b'

        var a = routeA.path;
        var b = routeB.path;

        if (a === "*") {
            return 1;
        }

        if (b === "*") {
            return -1;
        }

        if (a.startsWith("/:") && !b.startsWith("/:")) {
            return 1;
        }

        var al = length(a.split("/"));
        var bl = length(b.split("/"));
        var position = al !== bl ? (al > bl ? -1 : 1) : 0;

        if (position !== 0) {
            return position;
        }

        // Compare number of variables
        var av = length(a.match(/:|\*/g) || []);
        var bv = length(b.match(/:|\*/g) || []);
        return av !== bv ? (av > bv ? 1 : -1) : 0;
    });
};
//# sourceMappingURL=sortRoutes.js.map
