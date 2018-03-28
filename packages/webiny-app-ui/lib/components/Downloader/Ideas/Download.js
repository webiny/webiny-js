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

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Ui = _webinyApp.Webiny.Ui.Components;

var Download = (function(_Webiny$Ui$Component) {
    (0, _inherits3.default)(Download, _Webiny$Ui$Component);

    function Download(props) {
        (0, _classCallCheck3.default)(this, Download);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Download.__proto__ || Object.getPrototypeOf(Download)).call(this, props)
        );

        _this.hasDialog = false;
        _this.state = {
            showDialog: false
        };

        _this.bindMethods("elementDownload,download");
        return _this;
    }

    (0, _createClass3.default)(Download, [
        {
            key: "elementDownload",
            value: function elementDownload() {
                if (this.hasDialog) {
                    return this.setState({ showDialog: true });
                }

                return this.download.apply(this, arguments);
            }
        },
        {
            key: "download",
            value: function download() {
                var _refs$downloader;

                return (_refs$downloader = this.refs.downloader).download.apply(
                    _refs$downloader,
                    arguments
                );
            }
        }
    ]);
    return Download;
})(_webinyApp.Webiny.Ui.Component);

Download.defaultProps = {
    renderer: function renderer() {
        var _this2 = this;

        return _react2.default.createElement(
            "webiny-download",
            null,
            _react2.default.Children.map(this.props.children, function(child) {
                var props = {};
                if (_webinyApp.Webiny.isElementOfType(child, Ui.Download.Element)) {
                    props.download = _this2.elementDownload;
                }

                if (_webinyApp.Webiny.isElementOfType(child, Ui.Download.Dialog)) {
                    _this2.hasDialog = true;
                    props.download = _this2.download;
                    props.show = _this2.state.showDialog;
                    props.onHidden = function() {
                        return _this2.setState({ showDialog: false });
                    };
                }
                return _react2.default.cloneElement(child, props);
            }),
            _react2.default.createElement(Ui.Downloader, { ref: "downloader" })
        );
    }
};

exports.default = Download;
//# sourceMappingURL=Download.js.map
