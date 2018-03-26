"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

var _ErrorDetailsJs = require("./ErrorDetailsJs");

var _ErrorDetailsJs2 = _interopRequireDefault(_ErrorDetailsJs);

var _ErrorDetailsApi = require("./ErrorDetailsApi");

var _ErrorDetailsApi2 = _interopRequireDefault(_ErrorDetailsApi);

var _ErrorDetailsPhp = require("./ErrorDetailsPhp");

var _ErrorDetailsPhp2 = _interopRequireDefault(_ErrorDetailsPhp);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Logger.ErrorGroup
 */
var ErrorGroup = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(ErrorGroup, _Webiny$Ui$View);

    function ErrorGroup() {
        (0, _classCallCheck3.default)(this, ErrorGroup);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ErrorGroup.__proto__ || Object.getPrototypeOf(ErrorGroup)).apply(this, arguments)
        );
    }

    return ErrorGroup;
})(_webinyClient.Webiny.Ui.View);

ErrorGroup.defaultProps = {
    renderer: function renderer() {
        var _this2 = this;

        var statProps = {
            api: "/entities/webiny/logger-entry",
            query: { errorGroup: this.props.errorGroup.id, _sort: "-createdOn" },
            fields: "*",
            layout: null
        };

        var ErrorDetails = {
            js: _ErrorDetailsJs2.default,
            php: _ErrorDetailsPhp2.default,
            api: _ErrorDetailsApi2.default
        };

        return _react2.default.createElement(
            _webinyClient.Webiny.Ui.LazyLoad,
            { modules: ["List", "ExpandableList", "Filters"] },
            function(Ui) {
                return _react2.default.createElement(Ui.List, statProps, function(_ref) {
                    var list = _ref.list,
                        meta = _ref.meta;
                    return _react2.default.createElement(
                        Ui.ExpandableList,
                        null,
                        list.map(function(row) {
                            return _react2.default.createElement(
                                Ui.ExpandableList.Row,
                                { key: row.id },
                                _react2.default.createElement(
                                    Ui.ExpandableList.Field,
                                    { width: 6 },
                                    row.url
                                ),
                                _react2.default.createElement(
                                    Ui.ExpandableList.Field,
                                    { width: 4 },
                                    _react2.default.createElement(Ui.Filters.DateTime, {
                                        value: row.date
                                    })
                                ),
                                _react2.default.createElement(
                                    Ui.ExpandableList.RowDetailsContent,
                                    { title: row.url },
                                    _react2.default.createElement(
                                        ErrorDetails[_this2.props.errorGroup.type],
                                        { errorEntry: row }
                                    )
                                ),
                                _react2.default.createElement(
                                    Ui.ExpandableList.ActionSet,
                                    null,
                                    _react2.default.createElement(Ui.ExpandableList.Action, {
                                        label: _this2.i18n("Resolve Item"),
                                        icon: "icon-check",
                                        onClick: function onClick() {
                                            return _this2.props.resolveError(
                                                row,
                                                list,
                                                _this2.props.parentList
                                            );
                                        }
                                    })
                                )
                            );
                        })
                    );
                });
            }
        );
    }
};

exports.default = ErrorGroup;
//# sourceMappingURL=ErrorGroup.js.map
