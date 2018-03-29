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

var _cloneDeep2 = require("lodash/cloneDeep");

var _cloneDeep3 = _interopRequireDefault(_cloneDeep2);

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _webinyCompose = require("webiny-compose");

var _webinyCompose2 = _interopRequireDefault(_webinyCompose);

var _debug = require("debug");

var _debug2 = _interopRequireDefault(_debug);

var _pathToRegexp = require("path-to-regexp");

var _pathToRegexp2 = _interopRequireDefault(_pathToRegexp);

var _queryString = require("query-string");

var _queryString2 = _interopRequireDefault(_queryString);

var _history = require("history");

var _Route = require("./Route.cmp");

var _Route2 = _interopRequireDefault(_Route);

var _matchPath = require("./matchPath");

var _matchPath2 = _interopRequireDefault(_matchPath);

var _generatePath = require("./generatePath");

var _generatePath2 = _interopRequireDefault(_generatePath);

var _sortRoutes = require("./sortRoutes");

var _sortRoutes2 = _interopRequireDefault(_sortRoutes);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var debug = (0, _debug2.default)("webiny-app:router");

var Router = (function() {
    function Router() {
        (0, _classCallCheck3.default)(this, Router);

        this.routes = [];
    }

    (0, _createClass3.default)(Router, [
        {
            key: "configure",
            value: function configure(config) {
                this.config = Object.assign({}, config);
                this.history = config.history;
                this.middleware = (0, _webinyCompose2.default)(config.middleware);
                this.match = null;

                if (!this.history) {
                    this.history = (0, _history.createBrowserHistory)();
                }
            }
        },
        {
            key: "addRoute",
            value: function addRoute(route) {
                route.params = [];
                (0, _pathToRegexp2.default)(route.path, route.params);
                this.routes.push(route);
            }
        },
        {
            key: "goToRoute",
            value: function goToRoute(name, params) {
                var route =
                    name === "current"
                        ? this.route
                        : (0, _find3.default)(this.routes, { name: name });
                (0, _invariant2.default)(route, 'Route "' + name + '" does not exist!');
                var path = (0, _generatePath2.default)(route.path, params);

                this.history.push(path);
            }
        },
        {
            key: "createHref",
            value: function createHref(name, params) {
                var route = (0, _find3.default)(this.routes, { name: name });
                return (0, _generatePath2.default)(
                    (this.config.basename || "") + route.path,
                    params
                );
            }
        },
        {
            key: "getParams",
            value: function getParams() {
                var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                return name ? this.match.params[name] : this.match.params;
            }
        },
        {
            key: "getQuery",
            value: function getQuery() {
                var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                return name ? this.match.query[name] : this.match.query;
            }
        },
        {
            key: "getRoute",
            value: function getRoute(name) {
                return (0, _find3.default)(this.routes, { name: name });
            }
        },
        {
            key: "matchRoute",
            value: (function() {
                var _ref = (0, _asyncToGenerator3.default)(
                    /*#__PURE__*/ _regenerator2.default.mark(function _callee(pathname) {
                        var route, i, match, params;
                        return _regenerator2.default.wrap(
                            function _callee$(_context) {
                                while (1) {
                                    switch ((_context.prev = _context.next)) {
                                        case 0:
                                            debug("Matching location %o", pathname);
                                            route = null;

                                            if (pathname.startsWith(this.config.basename)) {
                                                pathname = pathname.substring(
                                                    this.config.basename.length
                                                );
                                            }

                                            if (pathname === "") {
                                                pathname = "/";
                                            }

                                            (0, _sortRoutes2.default)(this.routes);

                                            i = 0;

                                        case 6:
                                            if (!(i < this.routes.length)) {
                                                _context.next = 21;
                                                break;
                                            }

                                            route = (0, _cloneDeep3.default)(this.routes[i]);
                                            match = (0, _matchPath2.default)(pathname, {
                                                path: route.path,
                                                exact: route.exact
                                            });

                                            if (match) {
                                                _context.next = 11;
                                                break;
                                            }

                                            return _context.abrupt("continue", 18);

                                        case 11:
                                            match.query = _queryString2.default.parse(
                                                this.history.location.search
                                            );

                                            this.route = route;
                                            this.match = match;

                                            params = { route: route, output: null, match: match };
                                            _context.next = 17;
                                            return this.middleware(params);

                                        case 17:
                                            return _context.abrupt("return", params.output);

                                        case 18:
                                            i++;
                                            _context.next = 6;
                                            break;

                                        case 21:
                                            return _context.abrupt("return", route);

                                        case 22:
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

                function matchRoute(_x3) {
                    return _ref.apply(this, arguments);
                }

                return matchRoute;
            })()
        }
    ]);
    return Router;
})();

exports.default = Router;
//# sourceMappingURL=Router.js.map
