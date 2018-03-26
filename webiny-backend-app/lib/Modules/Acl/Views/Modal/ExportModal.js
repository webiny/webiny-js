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

var _get2 = require("babel-runtime/helpers/get");

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _webinyClient = require("webiny-client");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Acl.Modal.ExportModal
 */
var ExportModal = (function(_Webiny$Ui$ModalCompo) {
    (0, _inherits3.default)(ExportModal, _Webiny$Ui$ModalCompo);

    function ExportModal(props) {
        (0, _classCallCheck3.default)(this, ExportModal);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ExportModal.__proto__ || Object.getPrototypeOf(ExportModal)).call(this, props)
        );

        _this.state = {
            content: "",
            loading: true
        };
        return _this;
    }

    (0, _createClass3.default)(ExportModal, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                var _this2 = this;

                (0, _get3.default)(
                    ExportModal.prototype.__proto__ || Object.getPrototypeOf(ExportModal.prototype),
                    "componentWillMount",
                    this
                ).call(this);
                var _fields = this.props.fields;
                var api = new _webinyClient.Webiny.Api.Endpoint(this.props.api);
                return api.get(this.props.data.id, { _fields: _fields }).then(function(response) {
                    var data = response.getData("entity");
                    delete data.id;
                    if (_this2.props.map) {
                        data[_this2.props.map] = _lodash2.default.map(
                            data[_this2.props.map],
                            "slug"
                        );
                    }

                    _this2.setState({
                        loading: false,
                        content: JSON.stringify(data, null, 4)
                    });
                });
            }
        },
        {
            key: "renderDialog",
            value: function renderDialog() {
                var _props = this.props,
                    Modal = _props.Modal,
                    Copy = _props.Copy,
                    CodeHighlight = _props.CodeHighlight,
                    Loader = _props.Loader,
                    label = _props.label;

                return _react2.default.createElement(
                    Modal.Dialog,
                    null,
                    _react2.default.createElement(
                        Modal.Content,
                        null,
                        _react2.default.createElement(Modal.Header, {
                            title: this.i18n("Export {label}", { label: label })
                        }),
                        _react2.default.createElement(
                            Modal.Body,
                            { style: this.state.loading ? { height: 200 } : {} },
                            this.state.loading
                                ? _react2.default.createElement(Loader, null)
                                : _react2.default.createElement(
                                      CodeHighlight,
                                      { language: "json" },
                                      this.state.content
                                  )
                        ),
                        _react2.default.createElement(
                            Modal.Footer,
                            null,
                            _react2.default.createElement(Copy.Button, {
                                label: this.i18n("Copy"),
                                type: "primary",
                                value: this.state.content,
                                renderIf: this.state.content
                            })
                        )
                    )
                );
            }
        }
    ]);
    return ExportModal;
})(_webinyClient.Webiny.Ui.ModalComponent);

ExportModal.defaultProps = _lodash2.default.assign(
    {},
    _webinyClient.Webiny.Ui.ModalComponent.defaultProps,
    {
        api: "",
        data: {},
        map: "",
        label: "",
        fields: ""
    }
);

exports.default = _webinyClient.Webiny.createComponent(ExportModal, {
    modules: ["Modal", "Copy", "CodeHighlight", "Loader"]
});
//# sourceMappingURL=ExportModal.js.map
