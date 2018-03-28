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

var _isArray2 = require("lodash/isArray");

var _isArray3 = _interopRequireDefault(_isArray2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _isUndefined2 = require("lodash/isUndefined");

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _pickBy2 = require("lodash/pickBy");

var _pickBy3 = _interopRequireDefault(_pickBy2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Downloader = (function(_React$Component) {
    (0, _inherits3.default)(Downloader, _React$Component);

    function Downloader(props) {
        (0, _classCallCheck3.default)(this, Downloader);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Downloader.__proto__ || Object.getPrototypeOf(Downloader)).call(this, props)
        );

        _this.state = {};
        _this.downloaded = true;

        _this.download = _this.download.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Downloader, [
        {
            key: "componentDidUpdate",
            value: function componentDidUpdate() {
                this.downloader && this.downloader.submit();
            }
        },
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                if (this.props.onReady) {
                    this.props.onReady({
                        download: this.download
                    });
                }
            }
        },
        {
            key: "download",
            value: function download(httpMethod, url) {
                var params =
                    arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

                this.downloaded = false;
                this.setState({
                    httpMethod: httpMethod,
                    url: url,
                    params: (0, _pickBy3.default)(params, function(f) {
                        return !(0, _isUndefined3.default)(f);
                    })
                });
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                if (this.downloaded) {
                    return null;
                }

                var action = this.state.url;
                if (!action.startsWith("http")) {
                    action = _axios2.default.defaults.baseURL + action;
                }

                var params = null;
                if (this.state.params) {
                    params = [];
                    (0, _each3.default)(this.state.params, function(value, name) {
                        if ((0, _isArray3.default)(value)) {
                            value.map(function(v, index) {
                                params.push(
                                    _react2.default.createElement("input", {
                                        type: "hidden",
                                        name: name + "[]",
                                        value: v,
                                        key: name + "-" + index
                                    })
                                );
                            });
                            return;
                        }
                        params.push(
                            _react2.default.createElement("input", {
                                type: "hidden",
                                name: name,
                                value: value,
                                key: name
                            })
                        );
                    });
                }

                var authorization = null;
                if (this.state.httpMethod !== "GET") {
                    // TODO: after security
                    /*authorization = (
                    <input type="hidden" name="Authorization" value={Webiny.Cookies.get(this.props.tokenCookie)}/>
                );*/
                }

                this.downloaded = true;

                return _react2.default.createElement(
                    "form",
                    {
                        ref: function ref(_ref) {
                            return (_this2.downloader = _ref);
                        },
                        action: action,
                        method: this.state.httpMethod,
                        target: "_blank"
                    },
                    params,
                    authorization
                );
            }
        }
    ]);
    return Downloader;
})(_react2.default.Component);

Downloader.defaultProps = {
    tokenCookie: "webiny-token",
    onReady: _noop3.default
};

exports.default = (0, _webinyApp.createComponent)(Downloader);
//# sourceMappingURL=index.js.map
