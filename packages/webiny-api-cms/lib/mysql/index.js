"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _page = require("./page.mysql");

Object.defineProperty(exports, "PageTable", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_page).default;
    }
});

var _revision = require("./revision.mysql");

Object.defineProperty(exports, "RevisionTable", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_revision).default;
    }
});

var _category = require("./category.mysql");

Object.defineProperty(exports, "CategoryTable", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_category).default;
    }
});

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}
//# sourceMappingURL=index.js.map
