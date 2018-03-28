"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MySQLTable = exports.endpointMiddleware = exports.MatchedApiMethod = exports.ApiMethod = exports.ApiContainer = exports.EntityEndpoint = exports.Endpoint = exports.ApiResponse = exports.ApiErrorResponse = exports.Image = exports.File = exports.Entity = exports.requestUtils = exports.App = exports.versionFromHeader = exports.versionFromUrl = exports.middleware = exports.app = undefined;

var _middleware = require("./middleware");

Object.defineProperty(exports, "middleware", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_middleware).default;
    }
});

var _versionFromUrl = require("./etc/versionFromUrl");

Object.defineProperty(exports, "versionFromUrl", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_versionFromUrl).default;
    }
});

var _versionFromHeader = require("./etc/versionFromHeader");

Object.defineProperty(exports, "versionFromHeader", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_versionFromHeader).default;
    }
});

var _app = require("./etc/app");

Object.defineProperty(exports, "App", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_app).default;
    }
});

var _requestUtils = require("./etc/requestUtils");

Object.defineProperty(exports, "requestUtils", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_requestUtils).default;
    }
});

var _entities = require("./entities");

Object.defineProperty(exports, "Entity", {
    enumerable: true,
    get: function() {
        return _entities.Entity;
    }
});
Object.defineProperty(exports, "File", {
    enumerable: true,
    get: function() {
        return _entities.File;
    }
});
Object.defineProperty(exports, "Image", {
    enumerable: true,
    get: function() {
        return _entities.Image;
    }
});

var _response = require("./response");

Object.defineProperty(exports, "ApiErrorResponse", {
    enumerable: true,
    get: function() {
        return _response.ApiErrorResponse;
    }
});
Object.defineProperty(exports, "ApiResponse", {
    enumerable: true,
    get: function() {
        return _response.ApiResponse;
    }
});

var _endpoint = require("./endpoint");

Object.defineProperty(exports, "Endpoint", {
    enumerable: true,
    get: function() {
        return _endpoint.Endpoint;
    }
});
Object.defineProperty(exports, "EntityEndpoint", {
    enumerable: true,
    get: function() {
        return _endpoint.EntityEndpoint;
    }
});
Object.defineProperty(exports, "ApiContainer", {
    enumerable: true,
    get: function() {
        return _endpoint.ApiContainer;
    }
});
Object.defineProperty(exports, "ApiMethod", {
    enumerable: true,
    get: function() {
        return _endpoint.ApiMethod;
    }
});
Object.defineProperty(exports, "MatchedApiMethod", {
    enumerable: true,
    get: function() {
        return _endpoint.MatchedApiMethod;
    }
});

var _endpoint2 = require("./middleware/endpoint");

Object.defineProperty(exports, "endpointMiddleware", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_endpoint2).default;
    }
});

var _mySQL = require("./tables/mySQL");

Object.defineProperty(exports, "MySQLTable", {
    enumerable: true,
    get: function() {
        return _interopRequireDefault(_mySQL).default;
    }
});

var _app2 = require("./app");

var _app3 = _interopRequireDefault(_app2);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const app = new _app3.default();

exports.app = app;
//# sourceMappingURL=index.js.map
