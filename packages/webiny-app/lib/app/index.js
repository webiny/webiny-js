"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

var _webinyCompose = require("webiny-compose");

var _webinyCompose2 = _interopRequireDefault(_webinyCompose);

var _debug = require("debug");

var _debug2 = _interopRequireDefault(_debug);

var _webinyServiceManager = require("webiny-service-manager");

var _ModuleLoader = require("./ModuleLoader");

var _ModuleLoader2 = _interopRequireDefault(_ModuleLoader);

var _Router = require("./../router/Router");

var _Router2 = _interopRequireDefault(_Router);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var debug = (0, _debug2.default)("webiny-app");

var App = (function() {
    function App() {
        (0, _classCallCheck3.default)(this, App);

        this.configurators = [];
        this.modules = new _ModuleLoader2.default();
        this.services = new _webinyServiceManager.ServiceManager();
        this.router = new _Router2.default();
        this.initialized = false;
        this.configLoader = function() {
            return Promise.resolve({});
        };

        _axios2.default.defaults.validateStatus = function(status) {
            return status >= 200 && status < 500;
        };

        _axios2.default.defaults.timeout = 6000;
    }

    (0, _createClass3.default)(App, [
        {
            key: "use",
            value: function use(configurator) {
                this.configurators.push(configurator);
            }
        },
        {
            key: "configure",
            value: function configure(configLoader) {
                this.configLoader = configLoader;
            }
        },
        {
            key: "setup",
            value: (function() {
                var _ref = (0, _asyncToGenerator3.default)(
                    /*#__PURE__*/ _regenerator2.default.mark(function _callee() {
                        return _regenerator2.default.wrap(
                            function _callee$(_context) {
                                while (1) {
                                    switch ((_context.prev = _context.next)) {
                                        case 0:
                                            debug("Started setup");
                                            _context.next = 3;
                                            return this.configLoader();

                                        case 3:
                                            this.config = _context.sent;
                                            _context.next = 6;
                                            return (0, _webinyCompose2.default)(this.configurators)(
                                                { app: this }
                                            );

                                        case 6:
                                            this.initialized = true;
                                            debug("Finished setup");

                                        case 8:
                                        case "end":
                                            return _context.stop();
                                    }
                                }
                            },
                            _callee,
                            this
                        );
                    })
                );

                function setup() {
                    return _ref.apply(this, arguments);
                }

                return setup;
            })()
        }
    ]);
    return App;
})();

exports.default = App;
//# sourceMappingURL=index.js.map
