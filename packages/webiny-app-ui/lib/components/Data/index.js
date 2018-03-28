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

var _cloneDeep2 = require("lodash/cloneDeep");

var _cloneDeep3 = _interopRequireDefault(_cloneDeep2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _isNumber2 = require("lodash/isNumber");

var _isNumber3 = _interopRequireDefault(_isNumber2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Data = (function(_React$Component) {
    (0, _inherits3.default)(Data, _React$Component);

    function Data(props) {
        (0, _classCallCheck3.default)(this, Data);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Data.__proto__ || Object.getPrototypeOf(Data)).call(this, props)
        );

        _this.autoRefreshInterval = null; // Ony when 'autoRefresh' prop is used
        _this.mounted = false;
        _this.request = null;
        _this.cancelRequest = null;

        _this.state = {
            data: null,
            initiallyLoaded: false
        };

        _this.setData = _this.setData.bind(_this);
        _this.load = _this.load.bind(_this);
        _this.catchError = _this.catchError.bind(_this);
        _this.getCancelToken = _this.getCancelToken.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Data, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                this.setState({ loading: true });
            }
        },
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                var _this2 = this;

                this.mounted = true;
                this.request = this.props.api
                    .request({
                        cancelToken: this.getCancelToken()
                    })
                    .then(function(response) {
                        if (!_this2.mounted) {
                            return null;
                        }
                        _this2.setData(response);
                        _this2.setState({ initiallyLoaded: true });
                        _this2.props.onInitialLoad(response);
                        return response.data.data;
                    })
                    .catch(this.catchError);

                if ((0, _isNumber3.default)(this.props.autoRefresh)) {
                    this.autoRefreshInterval = setInterval(function() {
                        _this2.request = _this2.props.api
                            .request({
                                cancelToken: _this2.getCancelToken()
                            })
                            .then(function(response) {
                                _this2.setData(response);
                                return response.data.data;
                            })
                            .catch(_this2.catchError);
                    }, this.props.autoRefresh * 1000);
                }
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                this.mounted = false;

                if (this.cancelRequest) {
                    this.cancelRequest();
                }

                if (this.autoRefreshInterval) {
                    clearInterval(this.autoRefreshInterval);
                }
            }
        },
        {
            key: "getCancelToken",
            value: function getCancelToken() {
                var _this3 = this;

                return new _axios2.default.CancelToken(function(cancel) {
                    _this3.cancelRequest = cancel;
                });
            }
        },
        {
            key: "catchError",
            value: function catchError(err) {
                if (_axios2.default.isCancel(err)) {
                    return this.mounted ? this.setState({ loading: false }) : null;
                }
                _webinyApp.app.services.get("growler").danger(err.message);
            }
        },
        {
            key: "setData",
            value: function setData(response) {
                this.request = null;

                this.setState({
                    data: this.props.prepareLoadedData({ data: response.data.data }),
                    loading: false
                });
            }
        },
        {
            key: "load",
            value: function load() {
                var _this4 = this;

                var filters =
                    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

                this.setState({ loading: true });
                this.request = this.props.api.request({ params: filters }).then(function(response) {
                    if (!_this4.mounted) {
                        return;
                    }
                    _this4.setData(response);
                    _this4.props.onLoad(response);
                });
                return this.request;
            }
        },
        {
            key: "render",
            value: function render() {
                if (!(0, _isFunction3.default)(this.props.children)) {
                    throw new Error(
                        "Warning: Data component only accepts a function as its child element!"
                    );
                }

                if (this.props.waitForData && this.state.data === null) {
                    return null;
                }

                var Loader = this.props.Loader;

                var loader = this.state.loading
                    ? _react2.default.createElement(Loader, null)
                    : null;

                return _react2.default.createElement(
                    "webiny-data",
                    null,
                    this.props.children.call(this, {
                        data: (0, _cloneDeep3.default)(this.state.data),
                        load: this.load,
                        loader: loader,
                        $this: this
                    })
                );
            }
        }
    ]);
    return Data;
})(_react2.default.Component);

Data.defaultProps = {
    waitForData: true,
    autoRefresh: null,
    onLoad: _noop3.default,
    onInitialLoad: _noop3.default,
    prepareLoadedData: function prepareLoadedData(_ref) {
        var data = _ref.data;
        return data;
    }
};

exports.default = (0, _webinyApp.createComponent)([Data, _webinyApp.ApiComponent], {
    modules: ["Loader"]
});
//# sourceMappingURL=index.js.map
