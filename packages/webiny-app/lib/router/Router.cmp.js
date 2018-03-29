"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _jquery = require("jquery");

var _jquery2 = _interopRequireDefault(_jquery);

var _urlParse = require("url-parse");

var _urlParse2 = _interopRequireDefault(_urlParse);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Router = (function(_React$Component) {
    (0, _inherits3.default)(Router, _React$Component);

    function Router() {
        (0, _classCallCheck3.default)(this, Router);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Router.__proto__ || Object.getPrototypeOf(Router)).call(this)
        );

        _this.state = {
            route: null
        };
        return _this;
    }

    (0, _createClass3.default)(Router, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                var _this2 = this;

                var router = this.props.router;
                var history = router.history;

                this.unlisten = history.listen(function() {
                    router.matchRoute(history.location.pathname).then(function(route) {
                        _this2.setState({ route: route });
                    });
                });

                (0, _jquery2.default)(document)
                    .off("click", "a")
                    .on("click", "a", function(e) {
                        if (this.href.startsWith("javascript:void(0)") || this.href.endsWith("#")) {
                            return;
                        }

                        // Check if it's an anchor link
                        if (this.href.indexOf("#") > -1) {
                            return;
                        }

                        if (this.href.startsWith(window.location.origin)) {
                            e.preventDefault();

                            var url = (0, _urlParse2.default)(this.href, true);
                            history.push(url.pathname, router.config.basename);
                        }
                    });

                router.matchRoute(history.location.pathname).then(function(route) {
                    _this2.setState({ route: route });
                });
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                var _this3 = this;

                props.router
                    .matchRoute(props.router.history.location.pathname)
                    .then(function(route) {
                        if (typeof _this3.unlisten === "function") {
                            _this3.setState({ route: route });
                        }
                    });
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                this.unlisten();
                this.unlisten = null;
            }
        },
        {
            key: "render",
            value: function render() {
                return this.state.route;
            }
        }
    ]);
    return Router;
})(_react2.default.Component);

exports.default = Router;
//# sourceMappingURL=Router.cmp.js.map
