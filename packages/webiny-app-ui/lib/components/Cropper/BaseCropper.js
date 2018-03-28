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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _clone2 = require("lodash/clone");

var _clone3 = _interopRequireDefault(_clone2);

var _merge2 = require("lodash/merge");

var _merge3 = _interopRequireDefault(_merge2);

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Apply cropping"], ["Apply cropping"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Cropper.BaseCropper");

var BaseCropper = (function(_React$Component) {
    (0, _inherits3.default)(BaseCropper, _React$Component);

    function BaseCropper(props) {
        (0, _classCallCheck3.default)(this, BaseCropper);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (BaseCropper.__proto__ || Object.getPrototypeOf(BaseCropper)).call(this, props)
        );

        _this.state = {
            width: 0,
            height: 0
        };

        _this.id = (0, _uniqueId3.default)("img-cropper-");

        ["initCropper", "destroyCropper", "getImageModel", "getCacheBust", "applyCropping"].map(
            function(m) {
                return (_this[m] = _this[m].bind(_this));
            }
        );

        _this.options = {
            // Define the view mode of the cropper
            viewMode: 1, // 0, 1, 2, 3

            // Define the dragging mode of the cropper
            dragMode: "crop", // 'crop', 'move' or 'none'

            // Define the aspect ratio of the crop box
            aspectRatio: NaN,

            // An object with the previous cropping result data
            data: null,

            // A selector for adding extra containers to preview
            preview: "",

            // Re-render the cropper when resize the window
            responsive: true,

            // Restore the cropped area after resize the window
            restore: true,

            // Check if the current image is a cross-origin image
            checkCrossOrigin: true,

            // Check the current image's Exif Orientation information
            checkOrientation: true,

            // Show the black modal
            modal: true,

            // Show the dashed lines for guiding
            guides: false,

            // Show the center indicator for guiding
            center: true,

            // Show the white modal to highlight the crop box
            highlight: true,

            // Show the grid background
            background: true,

            // Enable to crop the image automatically when initialize
            autoCrop: true,

            // Define the percentage of automatic cropping area when initializes
            autoCropArea: 0.8,

            // Enable to move the image
            movable: true,

            // Enable to rotate the image
            rotatable: true,

            // Enable to scale the image
            scalable: true,

            // Enable to zoom the image
            zoomable: true,

            // Enable to zoom the image by dragging touch
            zoomOnTouch: true,

            // Enable to zoom the image by wheeling mouse
            zoomOnWheel: true,

            // Define zoom ratio when zoom the image by wheeling mouse
            wheelZoomRatio: 0.1,

            // Enable to move the crop box
            cropBoxMovable: true,

            // Enable to resize the crop box
            cropBoxResizable: true,

            // Toggle drag mode between "crop" and "move" when click twice on the cropper
            toggleDragModeOnDblclick: true,

            // Size limitation
            minCanvasWidth: 0,
            minCanvasHeight: 0,
            minCropBoxWidth: 0,
            minCropBoxHeight: 0,
            minContainerWidth: 200,
            minContainerHeight: 100,

            // Shortcuts of events
            ready: null,
            cropstart: null,
            cropmove: null,
            cropend: null,
            crop: null,
            zoom: null
        };
        return _this;
    }

    (0, _createClass3.default)(BaseCropper, [
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                this.destroyCropper();
            }
        },
        {
            key: "initCropper",
            value: function initCropper(element) {
                var _this2 = this;

                var Cropper = this.props.Cropper;

                var data = (0, _merge3.default)({}, this.options, this.props.config);
                data.crop = function(e) {
                    _this2.setState({
                        width: Math.floor(e.detail.width),
                        height: Math.floor(e.detail.height)
                    });
                };
                data.ready = function() {
                    if (data.width && data.height) {
                        _this2.cropper.setCropBoxData({
                            width: data.width,
                            height: data.height
                        });
                    }
                };

                this.cropper = new Cropper(element, data);
            }
        },
        {
            key: "destroyCropper",
            value: function destroyCropper() {
                if (this.cropper) {
                    this.cropper.destroy();
                    this.cropper = null;
                }
            }
        },
        {
            key: "getCacheBust",
            value: function getCacheBust() {
                var cacheBust = "";
                if (this.props.image && this.props.image.modifiedOn && !this.props.image.data) {
                    cacheBust = "?ts=" + new Date(this.props.image.modifiedOn).getTime();
                }
                return cacheBust;
            }
        },
        {
            key: "applyCropping",
            value: function applyCropping() {
                this.props.onCrop(this.getImageModel());
            }
        },
        {
            key: "getImageModel",
            value: function getImageModel() {
                var model = (0, _clone3.default)(this.props.image);
                var options = {};
                var canvas = null;

                if (this.props.config.getCroppedCanvas) {
                    canvas = this.props.config.getCroppedCanvas({
                        cropper: this.cropper,
                        props: this.props
                    });
                } else {
                    if (this.props.config.width) {
                        options.width = this.props.config.width;
                    }

                    if (this.props.config.height) {
                        options.height = this.props.config.height;
                    }

                    canvas = this.cropper.getCroppedCanvas(options);
                }

                model.data = canvas.toDataURL(model.type);
                return model;
            }
        },
        {
            key: "render",
            value: function render() {
                return _react2.default.cloneElement(
                    this.props.children,
                    Object.assign({}, (0, _omit3.default)(this.props, ["children"]), {
                        width: this.state.width,
                        height: this.state.height,
                        initCropper: this.initCropper.bind(this),
                        getCacheBust: this.getCacheBust.bind(this),
                        applyCropping: this.applyCropping.bind(this),
                        destroyCropper: this.destroyCropper.bind(this),
                        getImageModel: this.getImageModel.bind(this)
                    })
                );
            }
        }
    ]);
    return BaseCropper;
})(_react2.default.Component);

BaseCropper.defaultProps = {
    config: {},
    onCrop: _noop3.default,
    action: t(_templateObject)
};

exports.default = (0, _webinyApp.createComponent)(BaseCropper, {
    modules: [{ Cropper: "Vendor.Cropper" }]
});
//# sourceMappingURL=BaseCropper.js.map
