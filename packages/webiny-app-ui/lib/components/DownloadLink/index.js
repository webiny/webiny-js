"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

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

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var DownloadLink = (function(_React$Component) {
    (0, _inherits3.default)(DownloadLink, _React$Component);

    function DownloadLink(props) {
        (0, _classCallCheck3.default)(this, DownloadLink);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (DownloadLink.__proto__ || Object.getPrototypeOf(DownloadLink)).call(this, props)
        );

        _this.state = {
            showDialog: false
        };

        _this.dialog = null;

        _this.getDialog = _this.getDialog.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(DownloadLink, [
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps() {
                if (this.dialog) {
                    this.getDialog();
                }
            }
        },
        {
            key: "getDialog",
            value: function getDialog() {
                var result = this.props.download({
                    download: this.downloader.download,
                    data: this.props.params || null
                });
                // At this point we do not want to import Modal component to perform the check so we assume it is a ModalDialog if it is not null
                if (result) {
                    this.dialog = result;
                    this.setState({ showDialog: true });
                }
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    Downloader = _props.Downloader,
                    Link = _props.Link,
                    props = (0, _objectWithoutProperties3.default)(_props, ["Downloader", "Link"]);

                var downloader = _react2.default.createElement(Downloader, {
                    onReady: function onReady(downloader) {
                        return (_this2.downloader = downloader);
                    }
                });
                props.onClick = function() {
                    if (_this2.props.disabled) {
                        return;
                    }
                    if ((0, _isString3.default)(_this2.props.download)) {
                        _this2.downloader.download(
                            _this2.props.method,
                            _this2.props.download,
                            _this2.props.params
                        );
                    } else {
                        _this2.getDialog();
                    }
                };
                delete props["download"];

                var dialog = null;
                if (this.dialog) {
                    dialog = _react2.default.cloneElement(this.dialog, {
                        onHidden: function onHidden() {
                            _this2.dialog = null;
                            _this2.setState({ showDialog: false });
                        },
                        onComponentDidMount: function onComponentDidMount(dialog) {
                            if (_this2.state.showDialog) {
                                dialog.show();
                            }
                        }
                    });
                }

                return _react2.default.createElement(
                    Link,
                    (0, _omit3.default)(props, ["render"]),
                    this.props.children,
                    downloader,
                    dialog
                );
            }
        }
    ]);
    return DownloadLink;
})(_react2.default.Component);

DownloadLink.defaultProps = {
    download: null,
    method: "GET",
    params: null,
    disabled: false
};

exports.default = (0, _webinyApp.createComponent)(DownloadLink, {
    modules: ["Downloader", "Link"]
});
//# sourceMappingURL=index.js.map
