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

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
        ["Unsupported file type ({type})"],
        ["Unsupported file type ({type})"]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(
        ["File is too big"],
        ["File is too big"]
    );

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.FileReader");

var FileReader = (function(_React$Component) {
    (0, _inherits3.default)(FileReader, _React$Component);

    function FileReader(props) {
        (0, _classCallCheck3.default)(this, FileReader);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (FileReader.__proto__ || Object.getPrototypeOf(FileReader)).call(this, props)
        );

        _this.reset = function() {
            _this.dom.value = null;
        };

        _this.dom = null;

        ["onChange", "getFiles", "readFiles"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(FileReader, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                this.props.onReady({
                    getFiles: this.getFiles,
                    readFiles: this.readFiles
                });
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                this.reset = _noop3.default;
            }
        },
        {
            key: "getFiles",
            value: function getFiles() {
                this.dom.click();
            }
        },
        {
            key: "onChange",
            value: function onChange(e) {
                this.readFiles(e.target.files);
            }
        },
        {
            key: "readFiles",
            value: function readFiles(files) {
                var _this2 = this;

                var output = [];
                var errors = [];
                var loadedFiles = 0;

                (0, _each3.default)(files, function(file) {
                    var reader = new window.FileReader();

                    reader.onloadend = (function(f) {
                        return function(e) {
                            loadedFiles++;
                            var data = {
                                name: f.name,
                                size: f.size,
                                type: f.type
                            };

                            var errorMessage = null;
                            if (
                                _this2.props.accept.length &&
                                _this2.props.accept.indexOf(file.type) === -1
                            ) {
                                errorMessage = t(_templateObject)({ type: file.type });
                            } else if (_this2.props.sizeLimit < file.size) {
                                errorMessage = t(_templateObject2);
                            }

                            if (!errorMessage) {
                                data.data = e.target.result;
                                output.push(data);
                            } else {
                                data.message = errorMessage;
                                errors.push(data);
                            }

                            if (loadedFiles === files.length) {
                                _this2.props.onChange.apply(
                                    _this2,
                                    _this2.props.multiple
                                        ? [output, errors]
                                        : [output[0] || null, errors[0] || null]
                                );
                                _this2.reset();
                            }
                        };
                    })(file);

                    if (_this2.props.readAs === "binary") {
                        reader.readAsBinaryString(file);
                    } else {
                        reader.readAsDataURL(file);
                    }
                });
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                return _react2.default.createElement("input", {
                    ref: function ref(_ref) {
                        return (_this3.dom = _ref);
                    },
                    accept: this.props.accept,
                    style: { display: "none" },
                    type: "file",
                    multiple: this.props.multiple,
                    onChange: this.onChange
                });
            }
        }
    ]);
    return FileReader;
})(_react2.default.Component);

FileReader.defaultProps = {
    accept: [],
    multiple: false,
    sizeLimit: 2097152, // 10485760
    readAs: "data", // data || binary
    onChange: _noop3.default,
    onReady: _noop3.default
};

exports.default = (0, _webinyApp.createComponent)(FileReader);
//# sourceMappingURL=index.js.map
