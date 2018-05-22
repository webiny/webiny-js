"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Content"], ["Content"]),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(["Pages"], ["Pages"]),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(["Layouts"], ["Layouts"]),
    _templateObject4 = (0, _taggedTemplateLiteral3.default)(["Categories"], ["Categories"]),
    _templateObject5 = (0, _taggedTemplateLiteral3.default)(["Menus"], ["Menus"]),
    _templateObject6 = (0, _taggedTemplateLiteral3.default)(["Redirects"], ["Redirects"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppAdmin = require("webiny-app-admin");

var _CMS = require("./services/CMS");

var _CMS2 = _interopRequireDefault(_CMS);

var _PageManagerContainer = require("./views/pages/PageManagerContainer");

var _PageManagerContainer2 = _interopRequireDefault(_PageManagerContainer);

var _PageEditor = require("./views/pages/PageEditor");

var _PageEditor2 = _interopRequireDefault(_PageEditor);

var _CategoryList = require("./views/categories/CategoryList");

var _CategoryList2 = _interopRequireDefault(_CategoryList);

var _LayoutList = require("./views/layouts/LayoutList");

var _LayoutList2 = _interopRequireDefault(_LayoutList);

var _LayoutEditor = require("./views/layouts/LayoutEditor");

var _LayoutEditor2 = _interopRequireDefault(_LayoutEditor);

var _registerWidgets = require("./registerWidgets");

var _registerWidgets2 = _interopRequireDefault(_registerWidgets);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Cms.Admin.Menu");

exports.default = function() {
    return function(_ref, next) {
        var app = _ref.app;

        app.services.register("cms", function() {
            return new _CMS2.default();
        });

        (0, _registerWidgets2.default)();

        app.services
            .get("menu")
            .add(
                _react2.default.createElement(
                    _webinyAppAdmin.Menu,
                    { order: "1", label: t(_templateObject), icon: ["fas", "file-alt"] },
                    _react2.default.createElement(_webinyAppAdmin.Menu, {
                        order: 0,
                        label: t(_templateObject2),
                        route: "Cms.Page.List"
                    }),
                    _react2.default.createElement(_webinyAppAdmin.Menu, {
                        order: 0,
                        label: t(_templateObject3),
                        route: "Cms.Layout.List"
                    }),
                    _react2.default.createElement(_webinyAppAdmin.Menu, {
                        order: 1,
                        label: t(_templateObject4),
                        route: "Cms.Category.List"
                    }),
                    _react2.default.createElement(_webinyAppAdmin.Menu, {
                        order: 2,
                        label: t(_templateObject5),
                        route: "Cms.Menu.List"
                    }),
                    _react2.default.createElement(_webinyAppAdmin.Menu, {
                        order: 3,
                        label: t(_templateObject6),
                        route: "Cms.Redirect.List"
                    })
                )
            );

        app.router.addRoute({
            name: "Cms.Page.List",
            path: "/cms/pages",
            exact: true,
            render: function render() {
                return app.modules.load([{ Layout: "Admin.Layout" }]).then(function(_ref2) {
                    var Layout = _ref2.Layout;

                    return _react2.default.createElement(
                        Layout,
                        null,
                        _react2.default.createElement(_PageManagerContainer2.default, null)
                    );
                });
            }
        });

        app.router.addRoute({
            name: "Cms.Page.Editor",
            path: "/cms/pages/revision/:id",
            exact: true,
            render: function render() {
                return app.modules.load({ Layout: "Admin.Layout" }).then(function(_ref3) {
                    var Layout = _ref3.Layout;

                    return _react2.default.createElement(
                        Layout,
                        null,
                        _react2.default.createElement(_PageEditor2.default, null)
                    );
                });
            }
        });

        app.router.addRoute({
            name: "Cms.Layout.Edit",
            path: "/cms/layouts/:id",
            exact: true,
            render: function render() {
                return app.modules.load({ Layout: "Admin.Layout" }).then(function(_ref4) {
                    var Layout = _ref4.Layout;

                    return _react2.default.createElement(
                        Layout,
                        null,
                        _react2.default.createElement(_LayoutEditor2.default, null)
                    );
                });
            }
        });

        app.router.addRoute({
            name: "Cms.Layout.List",
            path: "/cms/layouts",
            exact: true,
            render: function render() {
                return app.modules.load({ Layout: "Admin.Layout" }).then(function(_ref5) {
                    var Layout = _ref5.Layout;

                    return _react2.default.createElement(
                        Layout,
                        null,
                        _react2.default.createElement(_LayoutList2.default, null)
                    );
                });
            }
        });

        app.router.addRoute({
            name: "Cms.Category.List",
            path: "/cms/categories",
            exact: true,
            render: function render() {
                return app.modules.load({ Layout: "Admin.Layout" }).then(function(_ref6) {
                    var Layout = _ref6.Layout;

                    return _react2.default.createElement(
                        Layout,
                        null,
                        _react2.default.createElement(_CategoryList2.default, null)
                    );
                });
            }
        });

        next();
    };
};
//# sourceMappingURL=app.js.map
