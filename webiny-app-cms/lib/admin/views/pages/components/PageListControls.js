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

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var PageListControls = (function(_React$Component) {
    (0, _inherits3.default)(PageListControls, _React$Component);

    function PageListControls() {
        (0, _classCallCheck3.default)(this, PageListControls);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (PageListControls.__proto__ || Object.getPrototypeOf(PageListControls)).call(this)
        );

        _this.state = {};
        return _this;
    }

    (0, _createClass3.default)(PageListControls, [
        {
            key: "getTitle",
            value: function getTitle(options, id) {
                var category = (0, _find3.default)(options, { value: id });
                return (0, _get3.default)(category, "data.title", "All");
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    _props$modules = _props.modules,
                    Dropdown = _props$modules.Dropdown,
                    Checkbox = _props$modules.Checkbox,
                    Grid = _props$modules.Grid,
                    OptionsData = _props$modules.OptionsData,
                    category = _props.category,
                    onCategory = _props.onCategory;

                return _react2.default.createElement(
                    Grid.Row,
                    null,
                    _react2.default.createElement(
                        Grid.Col,
                        { all: 3 },
                        _react2.default.createElement(
                            OptionsData,
                            { entity: "CmsCategory", fields: "id title", labelField: "title" },
                            function(_ref) {
                                var options = _ref.options;
                                return _react2.default.createElement(
                                    Dropdown,
                                    { title: _this2.getTitle(options, category), type: "balloon" },
                                    _react2.default.createElement(Dropdown.Header, {
                                        title: "Categories"
                                    }),
                                    _react2.default.createElement(Dropdown.Link, {
                                        key: "all",
                                        onClick: function onClick() {
                                            return onCategory(null);
                                        },
                                        title: "All"
                                    }),
                                    options.map(function(opt) {
                                        return _react2.default.createElement(Dropdown.Link, {
                                            key: opt.data.id,
                                            onClick: function onClick() {
                                                return onCategory(opt.data.id);
                                            },
                                            title: opt.label
                                        });
                                    })
                                );
                            }
                        )
                    ),
                    _react2.default.createElement(
                        Grid.Col,
                        { all: 3 },
                        _react2.default.createElement(
                            Dropdown,
                            { title: "Sort by", type: "balloon" },
                            _react2.default.createElement(Dropdown.Header, { title: "Sort by" }),
                            _react2.default.createElement(Dropdown.Link, {
                                onClick: function onClick() {},
                                title: "Insert"
                            }),
                            _react2.default.createElement(Dropdown.Link, {
                                onClick: function onClick() {},
                                title: "Update"
                            }),
                            _react2.default.createElement(Dropdown.Link, {
                                onClick: function onClick() {},
                                title: "Insert"
                            })
                        )
                    ),
                    _react2.default.createElement(
                        Grid.Col,
                        { all: 3 },
                        _react2.default.createElement(
                            Dropdown,
                            { title: "Actions", type: "balloon" },
                            _react2.default.createElement(Dropdown.Header, { title: "Actions" }),
                            _react2.default.createElement(Dropdown.Link, {
                                onClick: function onClick() {},
                                title: "Insert"
                            }),
                            _react2.default.createElement(Dropdown.Link, {
                                onClick: function onClick() {},
                                title: "Update"
                            }),
                            _react2.default.createElement(Dropdown.Link, {
                                onClick: function onClick() {},
                                title: "Insert"
                            })
                        )
                    )
                );
            }
        }
    ]);
    return PageListControls;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(PageListControls, {
    modules: ["Dropdown", "Checkbox", "Grid", "OptionsData"]
});
//# sourceMappingURL=PageListControls.js.map
