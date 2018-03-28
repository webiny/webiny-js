"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _SpaConfigPlugin = require("./plugins/SpaConfigPlugin");

Object.defineProperty(exports, "SpaConfigPlugin", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_SpaConfigPlugin).default;
    }
});

var _server = require("./server");

Object.defineProperty(exports, "server", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_server).default;
    }
});
exports.appEntry = appEntry;

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function appEntry(entry) {
    if (process.env.NODE_ENV === "production") {
        return entry;
    }

    return [
        "react-hot-loader/patch",
        "webpack-hot-middleware/client?path=/__webpack_hmr&quiet=false&noInfo=true&warn=false&overlay=true&reload=false",
        entry
    ];
}
//# sourceMappingURL=index.js.map
