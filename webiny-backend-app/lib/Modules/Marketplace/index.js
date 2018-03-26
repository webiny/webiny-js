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

var _webinyClient = require("webiny-client");

var _LoginRegister = require("./Views/LoginRegister");

var _LoginRegister2 = _interopRequireDefault(_LoginRegister);

var _Browse = require("./Views/Browse");

var _Browse2 = _interopRequireDefault(_Browse);

var _AppDetails = require("./Views/AppDetails");

var _AppDetails2 = _interopRequireDefault(_AppDetails);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Marketplace
 */
var Project = (function(_Webiny$App$Module) {
    (0, _inherits3.default)(Project, _Webiny$App$Module);

    function Project() {
        (0, _classCallCheck3.default)(this, Project);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Project.__proto__ || Object.getPrototypeOf(Project)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Project, [
        {
            key: "init",
            value: function init() {
                this.name = "Marketplace";

                this.registerMenus(
                    _react2.default.createElement(_webinyClient.Webiny.Ui.Menu, {
                        label: _webinyClient.Webiny.I18n("Marketplace"),
                        icon: "icon-basket_n",
                        route: "Marketplace.Browse"
                    })
                );

                this.registerRoutes(
                    new _webinyClient.Webiny.Route(
                        "Marketplace.LoginRegister",
                        "/marketplace/login-register",
                        _LoginRegister2.default,
                        "Marketplace"
                    ),
                    new _webinyClient.Webiny.Route(
                        "Marketplace.AppDetails",
                        "/marketplace/:id",
                        {
                            Content: _react2.default.createElement(_Browse2.default, {
                                appDetails: true
                            }),
                            Apps: _AppDetails2.default
                        },
                        "Marketplace"
                    ),
                    new _webinyClient.Webiny.Route(
                        "Marketplace.Browse",
                        "/marketplace",
                        _Browse2.default,
                        "Marketplace"
                    )
                );
            }
        }
    ]);
    return Project;
})(_webinyClient.Webiny.App.Module);

exports.default = Project;
//# sourceMappingURL=index.js.map
