"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _has2 = require("lodash/has");

var _has3 = _interopRequireDefault(_has2);

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _TabHeader = require("./TabHeader");

var _TabHeader2 = _interopRequireDefault(_TabHeader);

var _TabContent = require("./TabContent");

var _TabContent2 = _interopRequireDefault(_TabContent);

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Tabs = (function(_React$Component) {
    (0, _inherits3.default)(Tabs, _React$Component);

    function Tabs() {
        (0, _classCallCheck3.default)(this, Tabs);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Tabs.__proto__ || Object.getPrototypeOf(Tabs)).call(this)
        );

        _this.state = {
            selected: 0
        };

        _this.tabs = [];
        _this.tabsHeader = [];
        _this.tabsContent = [];

        ["parseChildren", "selectTab", "getSelectedTab"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(Tabs, [
        {
            key: "selectTab",
            value: function selectTab(index) {
                this.setState({ selected: index });
            }
        },
        {
            key: "getSelectedTab",
            value: function getSelectedTab() {
                return this.state.selected;
            }
        },
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                this.setState({
                    selected: _webinyApp.app.router.getParams("tab") || this.props.selected || 0
                });
                if (this.props.attachToForm) {
                    this.props.attachToForm(this);
                }
            }
        },
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                this.props.onReady &&
                    this.props.onReady({
                        selectTab: this.selectTab,
                        getSelectedTab: this.getSelectedTab
                    });
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                if (this.props.detachFromForm) {
                    this.props.detachFromForm(this);
                }
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                // Tabs selected via props
                if (props.selected !== this.props.selected) {
                    this.setState({ selected: props.selected });
                }
            }
        },
        {
            key: "parseChildren",
            value: function parseChildren(props, state) {
                var _this2 = this;

                this.tabsHeader = [];
                this.tabsContent = [];

                _react2.default.Children.map(props.children, function(child, index) {
                    var active = parseInt(state.selected) === index;

                    var headerProps = {
                        key: index,
                        active: active
                    };

                    (0,
                    _assign3.default)(headerProps, (0, _omit3.default)(child.props, ["render", "children", "renderContent", "renderHeader"]));

                    var tabClicked = function tabClicked(e) {
                        e.persist();
                        // Pass instance of Tabs, index clicked and event.
                        child.props.onClick({ tabs: _this2, index: index, e: e });
                        if (!e.isDefaultPrevented()) {
                            _this2.selectTab(index);
                        }
                    };

                    if ((0, _has3.default)(child.props, "renderHeader")) {
                        headerProps.render = child.props.renderHeader;
                    }

                    _this2.tabsHeader.push(
                        _react2.default.createElement(
                            _TabHeader2.default,
                            (0, _extends3.default)({}, headerProps, { onClick: tabClicked })
                        )
                    );

                    var contentProps = {
                        key: index,
                        active: active
                    };
                    (0,
                    _assign3.default)(contentProps, (0, _omit3.default)(child.props, ["render", "renderContent", "renderHeader"]));
                    if ((0, _has3.default)(child.props, "renderContent")) {
                        contentProps.render = child.props.renderContent;
                    }
                    _this2.tabsContent.push(
                        _react2.default.createElement(_TabContent2.default, contentProps)
                    );
                });
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                this.parseChildren(this.props, this.state);
                return this.props.renderTabs.call(this);
            }
        }
    ]);
    return Tabs;
})(_react2.default.Component);

Tabs.defaultProps = {
    position: "top", // top, left
    size: "default",
    selected: 0,
    renderTabs: function renderTabs() {
        var _classSet, _tabsNavClasses;

        var _props = this.props,
            styles = _props.styles,
            position = _props.position;

        var tabsContainerCss = (0, _classnames2.default)(
            styles.tabs,
            ((_classSet = {}),
            (0, _defineProperty3.default)(_classSet, styles.navigationTop, position === "top"),
            (0, _defineProperty3.default)(_classSet, styles.navigationLeft, position === "left"),
            _classSet)
        );

        var tabsNavClasses = ((_tabsNavClasses = {}),
        (0, _defineProperty3.default)(_tabsNavClasses, styles.navigation, true),
        (0, _defineProperty3.default)(
            _tabsNavClasses,
            styles.navigationLarge,
            this.props.size === "large"
        ),
        _tabsNavClasses);

        return _react2.default.createElement(
            "div",
            { className: tabsContainerCss },
            _react2.default.createElement(
                "div",
                { className: styles.body },
                _react2.default.createElement(
                    "ul",
                    { className: (0, _classnames2.default)(tabsNavClasses) },
                    this.props.renderHeader.call(this, { header: this.tabsHeader })
                ),
                _react2.default.createElement(
                    "div",
                    { className: styles.panes },
                    this.props.renderContent.call(this, { content: this.tabsContent })
                )
            )
        );
    },
    renderHeader: function renderHeader(_ref) {
        var header = _ref.header;

        return header;
    },
    renderContent: function renderContent(_ref2) {
        var content = _ref2.content;

        return content;
    }
};

exports.default = (0, _webinyApp.createComponent)(Tabs, { styles: _styles2.default, tabs: true });
//# sourceMappingURL=Tabs.js.map
