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

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _merge2 = require("lodash/merge");

var _merge3 = _interopRequireDefault(_merge2);

var _isPlainObject2 = require("lodash/isPlainObject");

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var apiProps = [
    "fields",
    "page",
    "perPage",
    "sort",
    "searchFields",
    "searchQuery",
    "searchOperator"
];

var getApiProps = function getApiProps(props) {
    var res = {};
    Object.keys(props).map(function(key) {
        if (apiProps.includes(key)) {
            res["_" + key] = props[key];
        }
    });

    return res;
};

var ApiComponent = (function(_React$Component) {
    (0, _inherits3.default)(ApiComponent, _React$Component);

    function ApiComponent(props) {
        (0, _classCallCheck3.default)(this, ApiComponent);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ApiComponent.__proto__ || Object.getPrototypeOf(ApiComponent)).call(this, props)
        );

        if (props.api) {
            var config = (0, _pick3.default)(props, ["method", "url", "body", "query"]);
            if (!config.query || (0, _isPlainObject3.default)(config.query)) {
                config.query = (0, _merge3.default)({}, config.query, getApiProps(props));
            }

            var apiUrl = typeof props.api === "string" ? props.api : props.api.defaults.url;
            _this.api = _axios2.default.create({
                method: config.method || "get",
                baseURL: _axios2.default.defaults.baseURL,
                url: config.url ? apiUrl + config.url : apiUrl,
                params: config.query,
                data: config.body
            });
        }
        return _this;
    }

    (0, _createClass3.default)(ApiComponent, [
        {
            key: "render",
            value: function render() {
                return _react2.default.cloneElement(
                    this.props.children,
                    Object.assign({}, (0, _omit3.default)(this.props, "children"), {
                        api: this.api
                    })
                );
            }
        }
    ]);
    return ApiComponent;
})(_react2.default.Component);

exports.default = ApiComponent;
//# sourceMappingURL=ApiComponent.cmp.js.map
