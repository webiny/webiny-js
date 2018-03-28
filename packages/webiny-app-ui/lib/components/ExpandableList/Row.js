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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _jquery = require("jquery");

var _jquery2 = _interopRequireDefault(_jquery);

var _webinyApp = require("webiny-app");

var _Field = require("./Field");

var _Field2 = _interopRequireDefault(_Field);

var _ActionSet = require("./ActionSet");

var _ActionSet2 = _interopRequireDefault(_ActionSet);

var _RowDetailsList = require("./RowDetailsList");

var _RowDetailsList2 = _interopRequireDefault(_RowDetailsList);

var _RowDetailsContent = require("./RowDetailsContent");

var _RowDetailsContent2 = _interopRequireDefault(_RowDetailsContent);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Row = (function(_React$Component) {
    (0, _inherits3.default)(Row, _React$Component);

    function Row(props) {
        (0, _classCallCheck3.default)(this, Row);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Row.__proto__ || Object.getPrototypeOf(Row)).call(this, props)
        );

        _this.state = {
            active: false,
            mounted: false,
            actionSetActive: false,
            rowClass: "expandable-list__row"
        };

        [
            "hideRowDetails",
            "showRowDetails",
            "handleClickOutside",
            "renderField",
            "attachCloseListener",
            "deatachCloseListener",
            "showActionSet",
            "hideActionSet",
            "getCurrentRowClass"
        ].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(Row, [
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                this.setState({ mounted: false });
                this.deatachCloseListener();
            }
        },
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                this.setState({ mounted: true });
            }
        },
        {
            key: "shouldComponentUpdate",
            value: function shouldComponentUpdate(nextProps, nextState) {
                if (nextState.active === true || nextState.actionSetActive === true) {
                    this.attachCloseListener();
                } else {
                    this.deatachCloseListener();
                }

                return true;
            }
        },
        {
            key: "attachCloseListener",
            value: function attachCloseListener() {
                document.addEventListener("click", this.handleClickOutside, true);
            }
        },
        {
            key: "deatachCloseListener",
            value: function deatachCloseListener() {
                document.removeEventListener("click", this.handleClickOutside, true);
            }
        },
        {
            key: "handleClickOutside",
            value: function handleClickOutside(e) {
                if (
                    (this.state.active === false && this.state.actionSetActive === false) ||
                    !this.state.mounted
                ) {
                    return true;
                }

                if (
                    (0, _jquery2.default)(this.dom).has(e.target).length === 0 &&
                    !(0, _jquery2.default)(this.dom).is(e.target)
                ) {
                    // clicked outside
                    if (this.state.active) {
                        this.hideRowDetails();
                    } else {
                        this.hideActionSet();
                    }
                } else {
                    // clicked inside
                    return false;
                }
            }
        },
        {
            key: "hideRowDetails",
            value: function hideRowDetails() {
                if (this.state.active === false || !this.state.mounted) {
                    return true;
                }

                // hide row details
                var details = this.dom.find(".expandable-list__row__details:first");
                this.dom.removeClass("expandable-list__row--active");
                details.hide();

                // show row content
                this.dom.find("div.expandable-list__row-wrapper:first").show();

                this.setState({ active: false });
            }
        },
        {
            key: "getCurrentRowClass",
            value: function getCurrentRowClass() {
                if (this.state.active) {
                    return "expandable-list__row--active expandable-list__row";
                }

                return "expandable-list__row";
            }
        },
        {
            key: "showRowDetails",
            value: function showRowDetails() {
                if (this.state.active === true) {
                    return true;
                }

                // show row details
                var details = (0, _jquery2.default)(this.dom).find(
                    ".expandable-list__row__details:first"
                );
                (0, _jquery2.default)(this.dom).addClass("expandable-list__row--active");
                details.show();

                // hide row content and action set
                (0, _jquery2.default)(this.dom)
                    .find("div.expandable-list__row-wrapper:first")
                    .hide();

                this.setState({ active: true });
            }
        },
        {
            key: "showActionSet",
            value: function showActionSet() {
                this.setState({
                    actionSetActive: true,
                    rowClass: this.getCurrentRowClass() + " expandable-list__row--active-action-set"
                });
            }
        },
        {
            key: "hideActionSet",
            value: function hideActionSet() {
                this.setState({
                    actionSetActive: false,
                    rowClass: this.getCurrentRowClass()
                });
            }
        },
        {
            key: "renderField",
            value: function renderField(field, i) {
                var _this2 = this;

                var props = (0, _omit3.default)(field.props, ["children"]);
                (0, _assign3.default)(props, {
                    data: this.data,
                    key: i,
                    onClick: function onClick() {
                        _this2.showRowDetails();
                    }
                });

                return _react2.default.cloneElement(field, props);
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var fields = [];
                var actionSet = false;
                var details = "";
                this.props.children.map(function(child) {
                    if ((0, _webinyApp.isElementOfType)(child, _Field2.default)) {
                        fields.push(child);
                    } else if (
                        (0, _webinyApp.isElementOfType)(child, _RowDetailsContent2.default) ||
                        (0, _webinyApp.isElementOfType)(child, _RowDetailsList2.default)
                    ) {
                        details = child;
                    } else if ((0, _webinyApp.isElementOfType)(child, _ActionSet2.default)) {
                        actionSet = child;
                    }
                });

                // render action set
                if (actionSet) {
                    var className =
                        "expandable-list__row__action-set expandable-list__row__fields__field flex-cell flex-width-2";
                    actionSet = _react2.default.createElement(
                        "div",
                        { className: className, onClick: this.showActionSet },
                        actionSet
                    );
                }

                // render fields
                fields = fields.map(this.renderField);

                var Grid = this.props.Grid;

                return _react2.default.createElement(
                    "div",
                    {
                        className: this.state.rowClass,
                        ref: function ref(_ref) {
                            return (_this3.dom = _ref);
                        }
                    },
                    _react2.default.createElement(
                        "div",
                        { className: "expandable-list__row-wrapper flex-row" },
                        fields,
                        actionSet
                    ),
                    _react2.default.createElement(
                        Grid.Row,
                        { className: "expandable-list__row__details", style: { display: "none" } },
                        _react2.default.createElement(
                            "div",
                            { className: "flex-row" },
                            _react2.default.createElement(
                                "div",
                                { className: "expandable-list__title flex-cell flex-width-10" },
                                _react2.default.createElement("h4", null, details.props.title)
                            ),
                            actionSet
                        ),
                        this.state.active && details
                    )
                );
            }
        }
    ]);
    return Row;
})(_react2.default.Component);

Row.defaultProps = {
    onClick: _noop3.default
};

exports.default = (0, _webinyApp.createComponent)(Row, { modules: ["Grid"] });
//# sourceMappingURL=Row.js.map
