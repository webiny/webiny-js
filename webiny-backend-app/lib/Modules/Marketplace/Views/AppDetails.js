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

var _get2 = require("babel-runtime/helpers/get");

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

require("./draft.scss");

var _InstallModal = require("../Components/InstallModal");

var _InstallModal2 = _interopRequireDefault(_InstallModal);

var _UpdateModal = require("../Components/UpdateModal");

var _UpdateModal2 = _interopRequireDefault(_UpdateModal);

var _UpdateSuccessModal = require("../Components/UpdateSuccessModal");

var _UpdateSuccessModal2 = _interopRequireDefault(_UpdateSuccessModal);

var _Sidebar = require("../Components/AppDetails/Sidebar");

var _Sidebar2 = _interopRequireDefault(_Sidebar);

var _Carousel = require("../Components/AppDetails/Carousel");

var _Carousel2 = _interopRequireDefault(_Carousel);

var _ContentBlock = require("../Components/AppDetails/ContentBlock");

var _ContentBlock2 = _interopRequireDefault(_ContentBlock);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Marketplace.AppDetails
 */
var AppDetails = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(AppDetails, _Webiny$Ui$View);

    function AppDetails(props) {
        (0, _classCallCheck3.default)(this, AppDetails);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (AppDetails.__proto__ || Object.getPrototypeOf(AppDetails)).call(this, props)
        );

        _this.bindMethods("renderCTA");
        return _this;
    }

    (0, _createClass3.default)(AppDetails, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                var _this2 = this;

                (0, _get3.default)(
                    AppDetails.prototype.__proto__ || Object.getPrototypeOf(AppDetails.prototype),
                    "componentWillMount",
                    this
                ).call(this);
                this.setState({ loading: true });
                var id = _webinyClient.Webiny.Router.getParams("id");
                new _webinyClient.Webiny.Api.Endpoint("/services/webiny/marketplace")
                    .get("apps/" + id)
                    .then(function(apiResponse) {
                        _this2.setState({ loading: false, app: apiResponse.getData("entity") });
                    });
            }
        },
        {
            key: "renderCTA",
            value: function renderCTA() {
                var _this3 = this;

                var app = this.state.app;
                var Button = this.props.Button;

                if (!app.updateAvailable || !app.webinyVersionOk) {
                    return null;
                }

                if (app.installedVersion) {
                    return _react2.default.createElement(Button, {
                        type: "primary",
                        icon: "fa-download",
                        label: "Update",
                        onClick: function onClick() {
                            return _this3.updateModal.show();
                        }
                    });
                }

                return _react2.default.createElement(Button, {
                    type: "secondary",
                    icon: "fa-download",
                    label: this.i18n("Install"),
                    onClick: function onClick() {
                        return _this3.installModal.show();
                    }
                });
            }
        }
    ]);
    return AppDetails;
})(_webinyClient.Webiny.Ui.View);

AppDetails.defaultProps = {
    renderer: function renderer() {
        var _this4 = this;

        var _state = this.state,
            loading = _state.loading,
            app = _state.app;
        var _props = this.props,
            styles = _props.styles,
            Link = _props.Link,
            View = _props.View,
            Grid = _props.Grid,
            Button = _props.Button,
            Tabs = _props.Tabs,
            Loader = _props.Loader,
            Alert = _props.Alert;

        if (loading) {
            return _react2.default.createElement(
                Loader,
                null,
                this.i18n("Fetching app details...")
            );
        }

        return _react2.default.createElement(
            "div",
            { className: styles.appDetails },
            !app.webinyVersionOk &&
                _react2.default.createElement(
                    Alert,
                    { type: "warning" },
                    this.i18n(
                        "This app requires Webiny {appWebinyVersion}. Your current Webiny is {currentVersion}.",
                        {
                            appWebinyVersion: _react2.default.createElement(
                                "strong",
                                null,
                                app.webinyVersion
                            ),
                            currentVersion: _react2.default.createElement(
                                "strong",
                                null,
                                app.installedWebinyVersion
                            )
                        }
                    ),
                    _react2.default.createElement("br", null),
                    this.i18n("Please update Webiny before attempting to install this app.")
                ),
            _react2.default.createElement(
                "div",
                { className: styles.header },
                _react2.default.createElement(
                    "div",
                    { className: styles.title },
                    _react2.default.createElement("img", {
                        src: app.logo.src,
                        className: styles.logo
                    }),
                    _react2.default.createElement(
                        "div",
                        { className: styles.titleBlock },
                        _react2.default.createElement("h2", null, app.name),
                        _react2.default.createElement("p", null, app.shortDescription)
                    )
                ),
                _react2.default.createElement(
                    "div",
                    { className: styles.action },
                    this.renderCTA(),
                    _react2.default.createElement(_InstallModal2.default, {
                        ref: function ref(_ref) {
                            return (_this4.installModal = _ref);
                        },
                        app: app
                    }),
                    _react2.default.createElement(_UpdateModal2.default, {
                        ref: function ref(_ref2) {
                            return (_this4.updateModal = _ref2);
                        },
                        app: app,
                        onUpdated: function onUpdated() {
                            return _this4.updateSuccessModal.show();
                        }
                    }),
                    _react2.default.createElement(_UpdateSuccessModal2.default, {
                        ref: function ref(_ref3) {
                            return (_this4.updateSuccessModal = _ref3);
                        },
                        app: app
                    })
                )
            ),
            _react2.default.createElement(
                Tabs,
                null,
                _react2.default.createElement(
                    Tabs.Tab,
                    { label: this.i18n("Details"), icon: "fa-home" },
                    _react2.default.createElement(
                        Grid.Row,
                        null,
                        _react2.default.createElement(
                            Grid.Col,
                            { all: 8 },
                            _react2.default.createElement(_Carousel2.default, {
                                images: app.images.map(function(a) {
                                    return a.src;
                                })
                            }),
                            _react2.default.createElement(_ContentBlock2.default, {
                                title: this.i18n("About"),
                                content: app.longDescription
                            })
                        ),
                        _react2.default.createElement(
                            Grid.Col,
                            { all: 4 },
                            _react2.default.createElement(_Sidebar2.default, { app: app })
                        )
                    )
                ),
                _react2.default.createElement(
                    Tabs.Tab,
                    { label: this.i18n("Installation"), icon: "fa-hdd-o" },
                    _react2.default.createElement(
                        Grid.Row,
                        null,
                        _react2.default.createElement(
                            Grid.Col,
                            { all: 8 },
                            _react2.default.createElement(_ContentBlock2.default, {
                                title: this.i18n("Installation"),
                                content: app.readme
                            })
                        ),
                        _react2.default.createElement(
                            Grid.Col,
                            { all: 4 },
                            _react2.default.createElement(_Sidebar2.default, { app: app })
                        )
                    )
                ),
                _react2.default.createElement(
                    Tabs.Tab,
                    { label: this.i18n("Change Log"), icon: "fa-pencil" },
                    _react2.default.createElement(
                        Grid.Row,
                        null,
                        _react2.default.createElement(
                            Grid.Col,
                            { all: 8 },
                            _react2.default.createElement(_ContentBlock2.default, {
                                title: this.i18n("Change log"),
                                content: app.changeLog
                            })
                        ),
                        _react2.default.createElement(
                            Grid.Col,
                            { all: 4 },
                            _react2.default.createElement(_Sidebar2.default, { app: app })
                        )
                    )
                )
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(AppDetails, {
    styles: _styles2.default,
    modules: ["View", "Link", "Gravatar", "Grid", "Button", "Tabs", "Loader", "Alert"]
});
//# sourceMappingURL=AppDetails.js.map
