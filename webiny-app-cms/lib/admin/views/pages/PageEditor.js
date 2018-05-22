"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _objectWithoutProperties2 = require("babel-runtime/helpers/objectWithoutProperties");

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Preview"], ["Preview"]),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(["Save page"], ["Save page"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _TitleInput = require("./components/editor/TitleInput");

var _TitleInput2 = _interopRequireDefault(_TitleInput);

var _PageContent = require("./components/editor/PageContent");

var _PageContent2 = _interopRequireDefault(_PageContent);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Cms.Admin.Views.PageEditor");

var PageEditor = (function(_React$Component) {
    (0, _inherits3.default)(PageEditor, _React$Component);

    function PageEditor() {
        (0, _classCallCheck3.default)(this, PageEditor);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (PageEditor.__proto__ || Object.getPrototypeOf(PageEditor)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(PageEditor, [
        {
            key: "filterContent",
            value: function filterContent(_ref, submit) {
                var content = _ref.content,
                    model = (0, _objectWithoutProperties3.default)(_ref, ["content"]);

                model.content = content.map(function(widget) {
                    if (widget.origin) {
                        delete widget["data"];
                        delete widget["settings"];
                    }

                    return widget;
                });

                submit(model);
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props$modules = this.props.modules,
                    View = _props$modules.View,
                    Link = _props$modules.Link,
                    Form = _props$modules.Form,
                    FormData = _props$modules.FormData,
                    FormError = _props$modules.FormError,
                    Icon = _props$modules.Icon,
                    Loader = _props$modules.Loader;

                return _react2.default.createElement(
                    FormData,
                    {
                        withRouter: true,
                        entity: "CmsRevision",
                        defaultModel: { content: [] },
                        fields: "id name active title slug content { id origin type data settings }"
                    },
                    function(_ref2) {
                        var model = _ref2.model,
                            submit = _ref2.submit,
                            error = _ref2.error,
                            loading = _ref2.loading;
                        return _react2.default.createElement(
                            Form,
                            {
                                model: model,
                                onSubmit: function onSubmit(model) {
                                    return _this2.filterContent(model, submit);
                                }
                            },
                            function(_ref3) {
                                var submit = _ref3.submit,
                                    model = _ref3.model,
                                    Bind = _ref3.Bind;
                                return _react2.default.createElement(
                                    View.Form,
                                    null,
                                    loading && _react2.default.createElement(Loader, null),
                                    _react2.default.createElement(
                                        View.Header,
                                        {
                                            render: function render(_ref4) {
                                                var props = _ref4.props;
                                                return _react2.default.createElement(
                                                    "div",
                                                    {
                                                        className: props.styles.viewHeader,
                                                        style: { padding: "20px 50px" }
                                                    },
                                                    _react2.default.createElement(
                                                        "div",
                                                        { className: props.styles.titleWrapper },
                                                        _react2.default.createElement(
                                                            Bind,
                                                            null,
                                                            _react2.default.createElement(
                                                                _TitleInput2.default,
                                                                { name: "title" }
                                                            )
                                                        )
                                                    ),
                                                    _react2.default.createElement(
                                                        "div",
                                                        { className: props.styles.titleRight },
                                                        props.children
                                                    ),
                                                    _react2.default.createElement(
                                                        "div",
                                                        { style: { marginTop: 5 } },
                                                        "Revision: ",
                                                        _react2.default.createElement(
                                                            "strong",
                                                            null,
                                                            model.name
                                                        ),
                                                        " (",
                                                        model.active ? "active" : "inactive",
                                                        ")"
                                                    )
                                                );
                                            }
                                        },
                                        _react2.default.createElement(
                                            Link,
                                            {
                                                url: "/cms/preview/" + model.id,
                                                type: "secondary",
                                                newTab: true
                                            },
                                            _react2.default.createElement(Icon, { icon: "eye" }),
                                            " ",
                                            t(_templateObject)
                                        ),
                                        _react2.default.createElement(
                                            Link,
                                            { type: "primary", align: "right", onClick: submit },
                                            t(_templateObject2)
                                        )
                                    ),
                                    error &&
                                        _react2.default.createElement(
                                            View.Error,
                                            null,
                                            _react2.default.createElement(FormError, {
                                                error: error
                                            })
                                        ),
                                    _react2.default.createElement(
                                        View.Body,
                                        {
                                            noPadding: true,
                                            noColor: true,
                                            style: { paddingTop: 15 }
                                        },
                                        _react2.default.createElement(
                                            Bind,
                                            null,
                                            _react2.default.createElement(_PageContent2.default, {
                                                name: "content"
                                            })
                                        )
                                    )
                                );
                            }
                        );
                    }
                );
            }
        }
    ]);
    return PageEditor;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(PageEditor, {
    modules: [
        "List",
        "View",
        "Link",
        "Icon",
        "Input",
        "Select",
        "Grid",
        "Modal",
        "Loader",
        "Tabs",
        "Form",
        "FormData",
        "FormError",
        "Button"
    ]
});
//# sourceMappingURL=PageEditor.js.map
