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

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ErrorDetailsJs = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(ErrorDetailsJs, _Webiny$Ui$View);

    function ErrorDetailsJs() {
        (0, _classCallCheck3.default)(this, ErrorDetailsJs);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ErrorDetailsJs.__proto__ || Object.getPrototypeOf(ErrorDetailsJs)).apply(
                this,
                arguments
            )
        );
    }

    return ErrorDetailsJs;
})(_webinyClient.Webiny.Ui.View);

ErrorDetailsJs.defaultProps = {
    renderer: function renderer() {
        var statProps = {
            api: "/entities/webiny/logger-entry",
            url: this.props.errorEntry.id,
            fields: "id,stack,clientData",
            prepareLoadedData: function prepareLoadedData(_ref) {
                var data = _ref.data;
                return data.entity;
            }
        };

        return _react2.default.createElement(
            _webinyClient.Webiny.Ui.LazyLoad,
            { modules: ["Data", "Grid", "CodeHighlight"] },
            function(Ui) {
                return _react2.default.createElement(Ui.Data, statProps, function(_ref2) {
                    var data = _ref2.data;
                    return _react2.default.createElement(
                        Ui.Grid.Row,
                        null,
                        _react2.default.createElement(
                            Ui.Grid.Col,
                            { all: 12 },
                            _react2.default.createElement(
                                Ui.CodeHighlight,
                                { language: "json" },
                                JSON.stringify(data.clientData, null, 2)
                            ),
                            _react2.default.createElement(Ui.CodeHighlight, null, data.stack)
                        )
                    );
                });
            }
        );
    }
};

exports.default = ErrorDetailsJs;
//# sourceMappingURL=ErrorDetailsJs.js.map
