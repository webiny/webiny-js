"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _apiContainer = require("./apiContainer");

var _apiContainer2 = _interopRequireDefault(_apiContainer);

var _app = require("./../etc/app");

var _app2 = _interopRequireDefault(_app);

var _index = require("./../index");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

// Container for ApiContainer instances
// The definition of an Endpoint class stays the same no matter how many instances we create so we only need one copy of ApiContainer per endpoint.
const apiContainers = {};

class Endpoint {
    // eslint-disable-next-line
    init(api) {
        // Override to define your custom API methods
        // NOTE: don't forget to call `super.init(api)`
    }

    getApi() {
        const classId = this.constructor.classId;
        const version = this.constructor.version;
        let apiContainer = _lodash2.default.get(apiContainers, [classId, version]);
        if (!apiContainer) {
            apiContainer = new _apiContainer2.default(this);
            _lodash2.default.set(apiContainers, [classId, version], apiContainer);
            this.init(apiContainer);
            _index.app.getApps().map(appInstance => {
                appInstance.applyEndpointExtensions(this);
            });
        }

        return apiContainer;
    }
}

exports.default = Endpoint;
//# sourceMappingURL=endpoint.js.map
