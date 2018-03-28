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

var _isArray2 = require("lodash/isArray");

var _isArray3 = _interopRequireDefault(_isArray2);

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _forEach2 = require("lodash/forEach");

var _forEach3 = _interopRequireDefault(_forEach2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _Empty = require("./Empty");

var _Empty2 = _interopRequireDefault(_Empty);

var _Row = require("./Row");

var _Row2 = _interopRequireDefault(_Row);

var _Field = require("./Field");

var _Field2 = _interopRequireDefault(_Field);

var _ActionSet = require("./ActionSet");

var _ActionSet2 = _interopRequireDefault(_ActionSet);

require("./styles.scss");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ExpandableList = (function(_React$Component) {
    (0, _inherits3.default)(ExpandableList, _React$Component);

    function ExpandableList(props) {
        (0, _classCallCheck3.default)(this, ExpandableList);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ExpandableList.__proto__ || Object.getPrototypeOf(ExpandableList)).call(this, props)
        );

        _this.state = {
            zIndex: 1000
        };

        _this.renderHeader = _this.renderHeader.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(ExpandableList, [
        {
            key: "renderHeader",
            value: function renderHeader(header, i) {
                var className = "";

                if ((0, _get3.default)(header, "className", false)) {
                    className = header.className;
                }

                return _react2.default.createElement(
                    "div",
                    {
                        className:
                            className +
                            " expandable-list__header__field flex-cell flex-width-" +
                            header.width,
                        key: i
                    },
                    header.name
                );
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                if (!this.props.data || (!this.props.data.length && this.props.showEmpty)) {
                    return _react2.default.createElement(_Empty2.default, null);
                }

                // get row and extract the header info
                var headers = [];
                var actionSet = false;
                (0, _forEach3.default)(this.props.children, function(row) {
                    if ((0, _webinyApp.isElementOfType)(row, _Row2.default)) {
                        if (_react2.default.isValidElement(row)) {
                            (0, _forEach3.default)(row.props.children, function(val) {
                                if ((0, _webinyApp.isElementOfType)(val, _ActionSet2.default)) {
                                    actionSet = true;
                                }

                                if (
                                    (0, _webinyApp.isElementOfType)(val, _Field2.default) &&
                                    (0, _get3.default)(val.props, "name", false)
                                ) {
                                    headers.push(
                                        (0, _omit3.default)(val.props, ["children", "renderer"])
                                    );
                                }
                            });

                            if (headers.length > 0) {
                                if (actionSet) {
                                    headers.push({ key: 99, width: 2 });
                                }
                                headers = _react2.default.createElement(
                                    "div",
                                    { className: "expandable-list__header flex-row" },
                                    headers.map(_this2.renderHeader)
                                );
                                return false; // exit foreach
                            }
                        }
                    }
                });

                // get rows
                var rows = [];
                (0, _forEach3.default)(this.props.children, function(row) {
                    if ((0, _webinyApp.isElementOfType)(row, _Row2.default)) {
                        rows.push(row);
                    } else if ((0, _isArray3.default)(row)) {
                        (0, _forEach3.default)(row, function(rowDetails) {
                            if ((0, _webinyApp.isElementOfType)(rowDetails, _Row2.default)) {
                                rows.push(rowDetails);
                            }
                        });
                        return false;
                    }
                });

                return _react2.default.createElement(
                    "div",
                    { className: "expandable-list" },
                    headers,
                    _react2.default.createElement(
                        "div",
                        { className: "expandable-list__content" },
                        rows
                    )
                );
            }
        }
    ]);
    return ExpandableList;
})(_react2.default.Component);

ExpandableList.defaultProps = {
    data: [],
    type: "simple"
};

exports.default = (0, _webinyApp.createComponent)(ExpandableList);
//# sourceMappingURL=ExpandableList.js.map
