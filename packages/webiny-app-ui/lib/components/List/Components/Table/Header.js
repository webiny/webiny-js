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

var _webinyApp = require("webiny-app");

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _styles = require("../../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Header = (function(_React$Component) {
    (0, _inherits3.default)(Header, _React$Component);

    function Header(props) {
        (0, _classCallCheck3.default)(this, Header);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Header.__proto__ || Object.getPrototypeOf(Header)).call(this, props)
        );

        _this.toggleSorter = _this.toggleSorter.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Header, [
        {
            key: "toggleSorter",
            value: function toggleSorter() {
                var sort = 0;
                switch (this.props.sorted) {
                    case 0:
                        sort = -1;
                        break;
                    case -1:
                        sort = 1;
                        break;
                    default:
                        sort = 0;
                }

                this.props.onSort(this.props.sort, sort);
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var classes = {};
                if (this.props.sorted && this.props.sorted !== 0) {
                    classes[_styles2.default.sorted] = true;
                }

                classes[this.props.alignLeftClass] = this.props.align === "left";
                classes[this.props.alignRightClass] = this.props.align === "right";
                classes[this.props.alignCenterClass] = this.props.align === "center";

                var sortIcon = {};
                sortIcon[this.props.sortedAscendingIcon] = this.props.sorted === 1;
                sortIcon[this.props.sortedDescendingIcon] = this.props.sorted === -1;
                sortIcon[this.props.sortableIcon] = this.props.sorted === 0;

                var Icon = this.props.Icon;

                var icon = this.props.sortable
                    ? _react2.default.createElement(Icon, {
                          icon: (0, _classnames2.default)(sortIcon)
                      })
                    : null;

                var content = this.props.label;
                if (this.props.sortable) {
                    content = _react2.default.createElement(
                        "a",
                        { href: "javascript:void(0);", onClick: this.toggleSorter },
                        this.props.label,
                        icon
                    );
                }

                return _react2.default.createElement(
                    "th",
                    { className: (0, _classnames2.default)(classes) },
                    this.props.children,
                    content
                );
            }
        }
    ]);
    return Header;
})(_react2.default.Component);

Header.defaultProps = {
    align: "left",
    alignLeftClass: "text-left",
    alignRightClass: "text-right",
    alignCenterClass: "text-center",
    sortedAscendingIcon: "icon-caret-up",
    sortedDescendingIcon: "icon-caret-down",
    sortableIcon: "icon-sort"
};

exports.default = (0, _webinyApp.createComponent)(Header, {
    modules: ["Icon"],
    styles: _styles2.default
});
//# sourceMappingURL=Header.js.map
