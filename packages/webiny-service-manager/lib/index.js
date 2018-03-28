"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ServiceManager = undefined;

var _serviceManager = require("./serviceManager");

Object.defineProperty(exports, "ServiceManager", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_serviceManager).default;
    }
});

var _serviceManager2 = _interopRequireDefault(_serviceManager);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

// Export an instance of ServiceManager
exports.default = new _serviceManager2.default();
//# sourceMappingURL=index.js.map
