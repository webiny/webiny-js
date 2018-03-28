"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
        ["Cropped image size: {size}"],
        ["Cropped image size: {size}"]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(["Crop image"], ["Crop image"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _BaseCropper = require("./BaseCropper");

var _BaseCropper2 = _interopRequireDefault(_BaseCropper);

var _CropperDialog = require("./CropperDialog");

var _CropperDialog2 = _interopRequireDefault(_CropperDialog);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Cropper.ModalCropper");

var ModalCropper = (function(_React$Component) {
    (0, _inherits3.default)(ModalCropper, _React$Component);

    function ModalCropper() {
        (0, _classCallCheck3.default)(this, ModalCropper);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ModalCropper.__proto__ || Object.getPrototypeOf(ModalCropper)).call(this)
        );

        _this.dialogId = (0, _uniqueId3.default)("modal-cropper-");
        _this.hide = _this.hide.bind(_this);
        _this.show = _this.show.bind(_this);
        _this.applyCropping = _this.applyCropping.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(ModalCropper, [
        {
            key: "componentDidUpdate",
            value: function componentDidUpdate(prevProps) {
                if (!prevProps.image && this.props.image) {
                    return this.show();
                }

                if (prevProps.image && !this.props.image) {
                    return this.hide();
                }
            }
        },
        {
            key: "shouldComponentUpdate",
            value: function shouldComponentUpdate(nextProps, nextState) {
                return (
                    !(0, _isEqual3.default)(nextProps.image, this.props.image) ||
                    !(0, _isEqual3.default)(nextProps.width, this.props.width) ||
                    !(0, _isEqual3.default)(nextProps.height, this.props.height) ||
                    !(0, _isEqual3.default)(nextState, this.state)
                );
            }
        },
        {
            key: "applyCropping",
            value: function applyCropping() {
                var _this2 = this;

                var model = this.props.getImageModel();
                this.hide().then(function() {
                    _this2.props.onCrop(model);
                });
            }
        },
        {
            key: "hide",
            value: function hide() {
                return _webinyApp.app.services.get("modal").hide(this.dialogId);
            }
        },
        {
            key: "show",
            value: function show() {
                return _webinyApp.app.services.get("modal").show(this.dialogId);
            }
        },
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    Modal = _props.Modal,
                    Button = _props.Button,
                    props = (0, _objectWithoutProperties3.default)(_props, ["Modal", "Button"]);

                var modalProps = {
                    name: this.dialogId,
                    onShown: props.onShown,
                    onHide: props.destroyCropper,
                    onHidden: props.onHidden,
                    closeOnClick: props.config.closeOnClick || props.closeOnClick,
                    className: ""
                };

                return _react2.default.createElement(
                    _CropperDialog2.default,
                    modalProps,
                    _react2.default.createElement(
                        Modal.Content,
                        null,
                        _react2.default.createElement(Modal.Header, {
                            title: props.title,
                            onClose: this.hide
                        }),
                        _react2.default.createElement(
                            Modal.Body,
                            null,
                            props.children,
                            _react2.default.createElement(
                                "div",
                                { className: "modalCrop" },
                                _react2.default.createElement("img", {
                                    onLoad: function onLoad(e) {
                                        return props.initCropper(e.currentTarget);
                                    },
                                    width: "100%",
                                    src:
                                        props.image &&
                                        (props.image.data || props.image.src) +
                                            props.getCacheBust(),
                                    style: { maxWidth: "100%" }
                                }),
                                _react2.default.createElement("div", { className: "clearfix" }),
                                t(_templateObject)({
                                    size: _react2.default.createElement(
                                        "strong",
                                        null,
                                        props.width,
                                        "x",
                                        props.height
                                    )
                                })
                            )
                        ),
                        _react2.default.createElement(
                            Modal.Footer,
                            null,
                            _react2.default.createElement(
                                Button,
                                {
                                    type: "primary",
                                    className: "pull-right ml5",
                                    onClick: this.applyCropping
                                },
                                props.action
                            )
                        )
                    )
                );
            }
        }
    ]);
    return ModalCropper;
})(_react2.default.Component);

ModalCropper.defaultProps = {
    config: {},
    title: t(_templateObject2),
    closeOnClick: false,
    onCrop: _noop3.default,
    onShown: _noop3.default,
    onHidden: _noop3.default
};

exports.default = (0, _webinyApp.createComponent)([ModalCropper, _BaseCropper2.default], {
    modules: ["Modal", "Button"]
});
//# sourceMappingURL=ModalCropper.js.map
