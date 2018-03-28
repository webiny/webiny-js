"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _debug = require("debug");

var _debug2 = _interopRequireDefault(_debug);

var _webinyCompose = require("webiny-compose");

var _webinyCompose2 = _interopRequireDefault(_webinyCompose);

var _semver = require("semver");

var _semver2 = _interopRequireDefault(_semver);

var _index = require("./index");

var _webinyServiceManager = require("webiny-service-manager");

var _apiErrorResponse = require("./response/apiErrorResponse");

var _apiErrorResponse2 = _interopRequireDefault(_apiErrorResponse);

var _registerBufferAttribute = require("./attributes/registerBufferAttribute");

var _registerBufferAttribute2 = _interopRequireDefault(_registerBufferAttribute);

var _registerFileAttributes = require("./attributes/registerFileAttributes");

var _registerFileAttributes2 = _interopRequireDefault(_registerFileAttributes);

var _registerImageAttributes = require("./attributes/registerImageAttributes");

var _registerImageAttributes2 = _interopRequireDefault(_registerImageAttributes);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Api {
    constructor() {
        this.config = {};
        this.apps = [];
        this.endpoints = {};
        this.requestMiddleware = () => _promise2.default.resolve();
        this.services = new _webinyServiceManager.ServiceManager();
    }

    getApps() {
        return this.apps;
    }

    getRequest() {
        return this.namespace.get("req");
    }

    setConfig(config) {
        this.config = config;
    }

    init(namespace) {
        this.namespace = namespace;
        // Prepare apps
        this.apps = this.config.apps;
        this.endpoints = prepareEndpoints.call(this);

        if (typeof this.config.versioning !== "function") {
            this.config.versioning = () => "latest";
        }

        this.requestMiddleware = (0, _webinyCompose2.default)(this.config.use);

        // Configure Entity layer
        if (this.config.entity) {
            // Register Entity driver
            _index.Entity.driver = this.config.entity.driver;
            // Register attributes
            this.config.entity.attributes &&
                this.config.entity.attributes({
                    bufferAttribute: _registerBufferAttribute2.default,
                    fileAttributes: _registerFileAttributes2.default,
                    imageAttributes: _registerImageAttributes2.default
                });
        }
    }

    /**
     * Handle request using middleware functions.
     * Response can be returned in 2 ways:
     * 1. set a `response` property of middleware `params` -> this will allow all functions to process the req/res.
     * 2. call `finish` from your middleware function -> this will return the result immediately and abort the middleware chain.
     * @param {express$Request} req
     * @param {express$Response} res
     * @returns {Promise<ApiResponse | typeof undefined>}
     */
    handleRequest(req, res) {
        const params = { req, res, versioning: this.config.versioning, response: undefined };
        return this.requestMiddleware(params).then(result => {
            // If result was returned using `finish` callback return the returned result.
            // If not - return the result stored in the params.
            const apiResponse = typeof result !== "undefined" ? result : params.response;

            if (
                typeof apiResponse !== "undefined" &&
                !(apiResponse instanceof _index.ApiResponse)
            ) {
                return new _apiErrorResponse2.default(
                    {},
                    "Response must be an instance of ApiResponse",
                    "WBY_INVALID_RESPONSE",
                    500
                );
            }

            return apiResponse;
        });
    }
}

/**
 * Get latest version.
 * @param {Array<string>} versions
 * @returns {string | undefined}
 */

// Attributes registration functions
function getLatestVersion(versions) {
    return versions.sort(_semver2.default.compare).pop();
}

/**
 * Traverse registered apps and construct endpoints map.
 * @returns {EndpointsMap}
 */
function prepareEndpoints() {
    const log = (0, _debug2.default)("api:endpoints");
    const endpoints = {};
    const urlPattern = this.config.urlPattern || "/{app}/{endpoint}";

    this.apps.map(app => {
        app.endpoints.map(endpoint => {
            const name = endpoint.prototype.constructor.name;
            const url = urlPattern
                .replace("{app}", _lodash2.default.kebabCase(app.name))
                .replace("{endpoint}", _lodash2.default.kebabCase(name));

            const definition = endpoints[url] || {
                classId: endpoint.classId,
                versions: {},
                latest: ""
            };

            definition.versions[endpoint.version] = endpoint;
            definition.latest = getLatestVersion((0, _keys2.default)(definition.versions));

            endpoints[url] = definition;
            log("Registered endpoint %o (%o)", url, "v" + endpoint.version);
        });
    });

    return endpoints;
}

exports.default = Api;
//# sourceMappingURL=app.js.map
