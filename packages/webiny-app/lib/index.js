"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Uploader = exports.i18n = exports.renderMiddleware = exports.resolveMiddleware = exports.Route = exports.Router = exports.ApiComponent = exports.LazyLoad = exports.elementHasFlag = exports.isElementOfType = exports.createComponent = exports.document = exports.app = undefined;

var _createComponent = require("./utils/createComponent");

Object.defineProperty(exports, "createComponent", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_createComponent).default;
    }
});

var _isElementOfType = require("./utils/isElementOfType");

Object.defineProperty(exports, "isElementOfType", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_isElementOfType).default;
    }
});

var _elementHasFlag = require("./utils/elementHasFlag");

Object.defineProperty(exports, "elementHasFlag", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_elementHasFlag).default;
    }
});

var _LazyLoad = require("./components/LazyLoad.cmp");

Object.defineProperty(exports, "LazyLoad", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_LazyLoad).default;
    }
});

var _ApiComponent = require("./components/ApiComponent.cmp");

Object.defineProperty(exports, "ApiComponent", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_ApiComponent).default;
    }
});

var _Router = require("./router/Router.cmp");

Object.defineProperty(exports, "Router", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_Router).default;
    }
});

var _Route = require("./router/Route.cmp");

Object.defineProperty(exports, "Route", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_Route).default;
    }
});

var _resolveMiddleware = require("./router/middleware/resolveMiddleware");

Object.defineProperty(exports, "resolveMiddleware", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_resolveMiddleware).default;
    }
});

var _renderMiddleware = require("./router/middleware/renderMiddleware");

Object.defineProperty(exports, "renderMiddleware", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_renderMiddleware).default;
    }
});

var _i18n = require("./utils/i18n");

Object.defineProperty(exports, "i18n", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_i18n).default;
    }
});

var _Uploader = require("./utils/Uploader");

Object.defineProperty(exports, "Uploader", {
    enumerable: true,
    get: function get() {
        return _interopRequireDefault(_Uploader).default;
    }
});

require("babel-polyfill");

var _app = require("./app");

var _app2 = _interopRequireDefault(_app);

var _document = require("./utils/document");

var _document2 = _interopRequireDefault(_document);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var app = new _app2.default();
var document = new _document2.default();

exports.app = app;
exports.document = document;
//# sourceMappingURL=index.js.map
