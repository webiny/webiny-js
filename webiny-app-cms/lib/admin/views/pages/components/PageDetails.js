"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _cloneDeep2 = require("lodash/cloneDeep");

var _cloneDeep3 = _interopRequireDefault(_cloneDeep2);

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
    ["{created|dateTime}"],
    ["{created|dateTime}"]
);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _PageContentPreview = require("./PageContentPreview");

var _PageContentPreview2 = _interopRequireDefault(_PageContentPreview);

var _PageRevisions = require("./PageRevisions");

var _PageRevisions2 = _interopRequireDefault(_PageRevisions);

var _PageDetails = require("./PageDetails.scss?");

var _PageDetails2 = _interopRequireDefault(_PageDetails);

var _blankStatePreview = require("./assets/blank-state-preview.svg");

var _blankStatePreview2 = _interopRequireDefault(_blankStatePreview);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Cms.Admin.Views.PageDetails");

var PageDetails = (function(_React$Component) {
    (0, _inherits3.default)(PageDetails, _React$Component);

    function PageDetails() {
        (0, _classCallCheck3.default)(this, PageDetails);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (PageDetails.__proto__ || Object.getPrototypeOf(PageDetails)).call(this)
        );

        _this.state = {
            revisions: [],
            revision: null
        };

        _this.prepare = _this.prepare.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(PageDetails, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                this.prepare(this.props);
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                if (
                    (0, _get3.default)(props.page, "id") !==
                    (0, _get3.default)(this.props, "page.id")
                ) {
                    this.prepare(props);
                }
            }
        },
        {
            key: "prepare",
            value: function prepare(props) {
                props.page &&
                    this.setState(function() {
                        var revision = (0, _find3.default)(props.page.revisions, { active: true });

                        return {
                            revision: Object.assign({}, revision),
                            revisions: props.page.revisions.map(function(data) {
                                return {
                                    value: data.id,
                                    label: data.name,
                                    data: data
                                };
                            })
                        };
                    });
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var _props = this.props,
                    page = _props.page,
                    moveToTrash = _props.moveToTrash,
                    moveToDrafts = _props.moveToDrafts,
                    togglePinned = _props.togglePinned,
                    togglePublished = _props.togglePublished,
                    _props$modules = _props.modules,
                    Tabs = _props$modules.Tabs,
                    Select = _props$modules.Select,
                    Icon = _props$modules.Icon,
                    Link = _props$modules.Link,
                    Dropdown = _props$modules.Dropdown;

                if (!page) {
                    return _react2.default.createElement(
                        "div",
                        { className: _PageDetails2.default.emptyPlaceholder },
                        _react2.default.createElement(
                            "div",
                            { className: _PageDetails2.default.emptyContent },
                            _react2.default.createElement("img", {
                                src: _blankStatePreview2.default,
                                alt: ""
                            }),
                            _react2.default.createElement(
                                "h3",
                                null,
                                "So, this is a preview pane."
                            ),
                            _react2.default.createElement(
                                "p",
                                null,
                                "Lets make it do it\u2019s job.",
                                _react2.default.createElement("br", null),
                                "Just click on the article on the left and see your article and revisions."
                            )
                        )
                    );
                }

                return _react2.default.createElement(
                    _react.Fragment,
                    null,
                    _react2.default.createElement(
                        "div",
                        { className: _PageDetails2.default.actions },
                        _react2.default.createElement(
                            Link,
                            { route: "Cms.Page.Editor", params: { id: this.state.revision.id } },
                            _react2.default.createElement(Icon, { icon: "edit" })
                        ),
                        _react2.default.createElement(
                            Link,
                            { onClick: page.status !== "trash" ? moveToTrash : moveToDrafts },
                            _react2.default.createElement(Icon, {
                                icon: page.status !== "trash" ? "trash-alt" : "undo"
                            })
                        ),
                        page.status !== "trash" &&
                            _react2.default.createElement(
                                Link,
                                { onClick: togglePublished },
                                _react2.default.createElement(Icon, {
                                    icon: page.status === "published" ? "eye-slash" : "eye"
                                })
                            ),
                        page.status !== "trash" &&
                            _react2.default.createElement(
                                Link,
                                {
                                    onClick: togglePinned,
                                    className: page.pinned ? _PageDetails2.default.pinned : null
                                },
                                _react2.default.createElement(Icon, { icon: "thumbtack" })
                            )
                    ),
                    _react2.default.createElement(
                        Tabs,
                        { size: "large" },
                        _react2.default.createElement(
                            Tabs.Tab,
                            { label: "Preview page" },
                            _react2.default.createElement(
                                "div",
                                { className: _PageDetails2.default.preview },
                                _react2.default.createElement(
                                    "div",
                                    { className: _PageDetails2.default.previewDetails },
                                    _react2.default.createElement(
                                        "div",
                                        null,
                                        "Date created:",
                                        " ",
                                        t(_templateObject)({
                                            created: page.createdOn
                                        })
                                    ),
                                    _react2.default.createElement(
                                        "div",
                                        null,
                                        "Category: ",
                                        page.category.title
                                    ),
                                    _react2.default.createElement(
                                        "div",
                                        null,
                                        "By: ",
                                        page.createdBy.firstName,
                                        " ",
                                        page.createdBy.lastName
                                    ),
                                    _react2.default.createElement(
                                        "div",
                                        null,
                                        "Status: ",
                                        page.status
                                    )
                                ),
                                _react2.default.createElement(
                                    "div",
                                    { className: _PageDetails2.default.previewRevision },
                                    this.state.revision &&
                                        _react2.default.createElement(Select, {
                                            useDataAsValue: true,
                                            value: this.state.revision.id,
                                            onChange: function onChange(revision) {
                                                revision && _this2.setState({ revision: revision });
                                            },
                                            options: (0, _cloneDeep3.default)(this.state.revisions)
                                        })
                                ),
                                this.state.revision &&
                                    _react2.default.createElement(_PageContentPreview2.default, {
                                        content: this.state.revision.content,
                                        styles: _PageDetails2.default
                                    })
                            )
                        ),
                        _react2.default.createElement(
                            Tabs.Tab,
                            { label: "Revisions" },
                            _react2.default.createElement(_PageRevisions2.default, {
                                revisions: page.revisions,
                                modules: { Icon: Icon, Dropdown: Dropdown }
                            })
                        )
                    )
                );
            }
        }
    ]);
    return PageDetails;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(PageDetails, {
    modules: ["Tabs", "Select", "Icon", "Link", "Dropdown"]
});
//# sourceMappingURL=PageDetails.js.map
