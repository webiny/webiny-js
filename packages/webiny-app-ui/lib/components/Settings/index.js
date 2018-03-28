"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
        ["That didn't go as expected..."],
        ["That didn't go as expected..."]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(
        ["Settings saved!"],
        ["Settings saved!"]
    );

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Settings");

var Settings = (function(_React$Component) {
    (0, _inherits3.default)(Settings, _React$Component);

    function Settings() {
        (0, _classCallCheck3.default)(this, Settings);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Settings.__proto__ || Object.getPrototypeOf(Settings)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Settings, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var growler = _webinyApp.app.services.get("growler");

                var Form = this.props.Form;

                var formProps = {
                    api: this.props.api,
                    createHttpMethod: "patch",
                    onSuccessMessage: this.props.onSuccessMessage,
                    onSubmitSuccess: this.props.onSubmitSuccess,
                    children: this.props.children,
                    loadModel: function loadModel(_ref) {
                        var form = _ref.form;

                        form.showLoading();
                        return form.props.api.get("/").then(function(response) {
                            form.hideLoading();
                            if (response.data.code) {
                                growler.danger(response.data.message, t(_templateObject), true);
                                return form.handleApiError(response);
                            }
                            return response.data.data;
                        });
                    }
                };

                return _react2.default.createElement(Form, formProps);
            }
        }
    ]);
    return Settings;
})(_react2.default.Component);

Settings.defaultProps = {
    api: "/settings",
    onSuccessMessage: function onSuccessMessage() {
        return t(_templateObject2);
    },
    onSubmitSuccess: null
};

exports.default = (0, _webinyApp.createComponent)(Settings, { modules: ["Form"] });
//# sourceMappingURL=index.js.map
