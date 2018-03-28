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

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Upload failed"], ["Upload failed"]),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(["Hint"], ["Hint"]),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(
        ["Scroll to zoom in/out"],
        ["Scroll to zoom in/out"]
    );

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.HtmlEditor");

var HtmlEditor = (function(_React$Component) {
    (0, _inherits3.default)(HtmlEditor, _React$Component);

    function HtmlEditor(props) {
        (0, _classCallCheck3.default)(this, HtmlEditor);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (HtmlEditor.__proto__ || Object.getPrototypeOf(HtmlEditor)).call(this, props)
        );

        _this.state = Object.assign({}, props.initialState, {
            cropImage: null,
            uploadPercentage: null,
            value: props.value
        });

        _this.dom = null;
        _this.editor = null;
        _this.delay = null;
        _this.index = 0;

        var api = _axios2.default.create({
            url: props.api
        });
        _this.uploader = new _webinyApp.Uploader(api);

        [
            "getTextareaElement",
            "getEditor",
            "getCropper",
            "onCropperHidden",
            "uploadImage",
            "fileChanged",
            "applyValue",
            "changed",
            "renderError"
        ].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(HtmlEditor, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                var _this2 = this;

                if (this.props.attachToForm) {
                    this.props.attachToForm(this);
                }

                var Quill = this.props.Quill;

                this.editor = new Quill(this.getTextareaElement(), {
                    modules: {
                        toolbar: this.props.toolbar
                    },
                    theme: "snow",
                    bounds: document.body
                });

                var toolbar = this.editor.getModule("toolbar");
                toolbar.addHandler("image", function() {
                    _this2.reader.getFiles();
                });

                this.editor.on("text-change", function() {
                    _this2.setState({ value: _this2.editor.root.innerHTML }, _this2.changed);
                });

                this.editor.pasteHTML(this.props.value);
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                if (!this.delay && props.value !== this.editor.root.innerHTML) {
                    this.editor.pasteHTML(props.value);
                }
            }
        },
        {
            key: "shouldComponentUpdate",
            value: function shouldComponentUpdate(nextProps, nextState) {
                var oldState = (0, _pick3.default)(this.state, [
                    "cropImage",
                    "uploadPercentage",
                    "error"
                ]);
                var newState = (0, _pick3.default)(nextState, [
                    "cropImage",
                    "uploadPercentage",
                    "error"
                ]);
                return !(0, _isEqual3.default)(oldState, newState);
            }
        },
        {
            key: "componentDidUpdate",
            value: function componentDidUpdate() {
                this.editor.pasteHTML(this.state.value);
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                delete this.editor;
            }
        },
        {
            key: "applyValue",
            value: function applyValue(value) {
                clearTimeout(this.delay);
                this.delay = null;
                this.props.onChange(value);
            }
        },
        {
            key: "changed",
            value: function changed() {
                var _this3 = this;

                clearTimeout(this.delay);
                this.delay = null;
                this.delay = setTimeout(function() {
                    return _this3.applyValue(_this3.state.value);
                }, 300);
            }
        },
        {
            key: "fileChanged",
            value: function fileChanged(file, error) {
                // mark current index
                this.index = this.editor.getSelection(true).index;

                if (error) {
                    this.setState({ error: error });
                    return;
                }

                this.setState({ error: null });

                if (this.props.cropper) {
                    this.setState({ cropImage: file });
                } else {
                    this.uploadImage(file);
                }
            }
        },
        {
            key: "uploadImage",
            value: function uploadImage(data) {
                var _this4 = this;

                this.uploader.upload(
                    data,
                    function(_ref) {
                        var percentage = _ref.percentage;

                        _this4.setState({ uploadPercentage: percentage });
                    },
                    function(_ref2) {
                        var file = _ref2.file;

                        _this4.editor.insertEmbed(_this4.index, "image", file.entity.src);
                        // reposition index to previous position
                        _this4.setState({ uploadPercentage: null });
                        _this4.editor.setSelection({ index: _this4.index, length: 0 });
                    },
                    function(_ref3) {
                        var response = _ref3.response;

                        _webinyApp.app.services
                            .get("growler")
                            .danger(response.message, t(_templateObject));
                        _this4.setState({ uploadPercentage: null });
                    }
                );
            }
        },
        {
            key: "getCropper",
            value: function getCropper() {
                var children =
                    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var _props = this.props,
                    cropper = _props.cropper,
                    Cropper = _props.Cropper;

                if (!cropper) {
                    return null;
                }

                if (cropper.inline) {
                    return _react2.default.createElement(
                        Cropper.Inline,
                        {
                            title: cropper.title,
                            action: cropper.action,
                            onHidden: this.onCropperHidden,
                            onCrop: this.uploadImage,
                            config: cropper.config,
                            image: this.state.cropImage
                        },
                        children
                    );
                }

                return _react2.default.createElement(
                    Cropper.Modal,
                    {
                        title: cropper.title,
                        action: cropper.action,
                        onHidden: this.onCropperHidden,
                        onCrop: this.uploadImage,
                        config: cropper.config,
                        image: this.state.cropImage
                    },
                    children
                );
            }
        },
        {
            key: "onCropperHidden",
            value: function onCropperHidden() {
                this.setState({ cropImage: null });
            }
        },
        {
            key: "getEditor",
            value: function getEditor() {
                return this.editor;
            }
        },
        {
            key: "getTextareaElement",
            value: function getTextareaElement() {
                return this.dom;
            }
        },
        {
            key: "renderError",
            value: function renderError() {
                var error = null;
                if (this.state.error) {
                    var Alert = this.props.Alert;

                    error = _react2.default.createElement(
                        Alert,
                        { type: "error" },
                        this.state.error.message
                    );
                }
                return error;
            }
        },
        {
            key: "render",
            value: function render() {
                var _this5 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props2 = this.props,
                    Alert = _props2.Alert,
                    Progress = _props2.Progress,
                    FileReader = _props2.FileReader,
                    FormGroup = _props2.FormGroup;

                var uploader = null;
                if (this.state.uploadPercentage !== null) {
                    uploader = _react2.default.createElement(
                        "div",
                        null,
                        _react2.default.createElement(
                            "strong",
                            null,
                            "Your image is being uploaded..."
                        ),
                        _react2.default.createElement(Progress, {
                            value: this.state.uploadPercentage
                        })
                    );
                }

                return _react2.default.createElement(
                    FormGroup,
                    { className: this.props.className },
                    this.renderLabel.call(this),
                    this.renderInfo.call(this),
                    _react2.default.createElement(
                        "div",
                        { className: "inputGroup" },
                        this.renderError(),
                        uploader,
                        _react2.default.createElement("div", {
                            ref: function ref(_ref4) {
                                return (_this5.dom = _ref4);
                            },
                            className: "editor"
                        }),
                        _react2.default.createElement(FileReader, {
                            accept: this.props.accept,
                            onReady: function onReady(reader) {
                                return (_this5.reader = reader);
                            },
                            sizeLimit: this.props.sizeLimit,
                            onChange: this.fileChanged
                        }),
                        this.getCropper(
                            _react2.default.createElement(
                                Alert,
                                { type: "info", title: t(_templateObject2) },
                                t(_templateObject3)
                            )
                        )
                    ),
                    this.props.renderDescription.call(this)
                );
            }
        }
    ]);
    return HtmlEditor;
})(_react2.default.Component);

HtmlEditor.defaultProps = {
    imageApi: "/entities/webiny/images",
    accept: ["image/jpg", "image/jpeg", "image/gif", "image/png"],
    sizeLimit: 2485760,
    toolbar: [
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block", "link", "image"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ size: ["small", false, "large", "huge"] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ color: [] }, { background: [] }],
        [{ font: [] }],
        [{ align: [] }],
        ["clean"]
    ],
    cropper: {
        title: "Crop your image",
        action: "Insert image",
        config: {
            closeOnClick: false,
            autoCropArea: 0.7
        }
    }
};

exports.default = (0, _webinyApp.createComponent)([HtmlEditor, _webinyAppUi.FormComponent], {
    modules: [
        "Alert",
        "Cropper",
        "FileReader",
        "Progress",
        "FormGroup",
        { Quill: "Vendors/Quill" }
    ],
    formComponent: true
});
//# sourceMappingURL=index.js.map
