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

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _isArray2 = require("lodash/isArray");

var _isArray3 = _interopRequireDefault(_isArray2);

var _findLastIndex2 = require("lodash/findLastIndex");

var _findLastIndex3 = _interopRequireDefault(_findLastIndex2);

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
    ["Type and hit ENTER"],
    ["Type and hit ENTER"]
);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _webinyValidation = require("webiny-validation");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Tags");

var Tags = (function(_React$Component) {
    (0, _inherits3.default)(Tags, _React$Component);

    function Tags(props) {
        (0, _classCallCheck3.default)(this, Tags);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Tags.__proto__ || Object.getPrototypeOf(Tags)).call(this, props)
        );

        _this.state = Object.assign({}, props.initialState);

        ["focusTagInput", "removeTag", "addTag", "validateTag"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(Tags, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                if (this.props.attachToForm) {
                    this.props.attachToForm(this);
                }

                if (this.props.autoFocus) {
                    this.tagInput.focus();
                }
            }
        },
        {
            key: "focusTagInput",
            value: function focusTagInput() {
                this.tagInput.focus();
            }
        },
        {
            key: "removeTag",
            value: function removeTag(index) {
                var value = this.props.value;

                value.splice(index, 1);
                this.props.onChange(value);
            }
        },
        {
            key: "tagExists",
            value: function tagExists(tag) {
                return (0, _find3.default)(this.props.value, function(data) {
                    return data === tag;
                });
            }
        },
        {
            key: "addTag",
            value: function addTag(e) {
                var _this2 = this;

                if (e.ctrlKey || e.metaKey) {
                    return;
                }
                var tags = this.props.value;
                var input = this.tagInput;
                var emptyField = !input.value;
                var canRemove = (emptyField && e.keyCode === 8) || e.keyCode === 46;
                var skipAdd = e.key !== "Tab" && e.key !== "Enter";

                if (canRemove) {
                    this.removeTag((0, _findLastIndex3.default)(tags));
                }

                if (skipAdd) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                if (emptyField) {
                    return this.validateTag();
                }

                if (this.tagExists(input.value)) {
                    return;
                }

                if (!(0, _isArray3.default)(tags)) {
                    tags = [];
                }

                this.validateTag(input.value)
                    .then(function() {
                        tags.push(input.value);
                        input.value = "";
                        _this2.props.onChange(tags);
                        _this2.setState({ tag: "" });
                    })
                    .catch(function(e) {
                        _this2.props.onInvalidTag({ value: input.value, event: e });
                    });
            }
        },
        {
            key: "validateTag",
            value: function validateTag() {
                var value =
                    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                return _webinyValidation.validation.validate(value, this.props.validateTags);
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    FormGroup = _props.FormGroup,
                    styles = _props.styles;

                var input = {
                    type: "text",
                    className: styles.input,
                    ref: function ref(tagInput) {
                        return (_this3.tagInput = tagInput);
                    },
                    onKeyDown: this.addTag,
                    placeholder: this.props.placeholder,
                    onBlur: this.props.validate,
                    readOnly: (0, _get3.default)(this.props, "readOnly", false)
                };

                return _react2.default.createElement(
                    FormGroup,
                    { valid: this.state.isValid, className: this.props.className },
                    this.props.renderLabel.call(this),
                    _react2.default.createElement(
                        "div",
                        { className: styles.container, onClick: this.focusTagInput },
                        _react2.default.createElement(
                            "div",
                            { className: styles.tag },
                            (0, _isArray3.default)(this.props.value) &&
                                this.props.value.map(function(value, index) {
                                    return _this3.props.renderTag.call(_this3, {
                                        value: value,
                                        index: index
                                    });
                                }),
                            _react2.default.createElement("input", input)
                        )
                    ),
                    this.props.renderDescription.call(this),
                    this.props.renderValidationMessage.call(this)
                );
            }
        }
    ]);
    return Tags;
})(_react2.default.Component);

Tags.defaultProps = {
    autoFocus: false,
    validateTags: null,
    placeholder: t(_templateObject),
    onInvalidTag: _noop3.default,
    renderTag: function renderTag(_ref) {
        var _this4 = this;

        var value = _ref.value,
            index = _ref.index;
        var _props2 = this.props,
            Icon = _props2.Icon,
            styles = _props2.styles;

        return _react2.default.createElement(
            "div",
            { key: value, className: styles.block },
            _react2.default.createElement("p", null, value),
            _react2.default.createElement(Icon, {
                icon: "icon-cancel",
                onClick: function onClick() {
                    return _this4.removeTag(index);
                }
            })
        );
    }
};

exports.default = (0, _webinyApp.createComponent)([Tags, _webinyAppUi.FormComponent], {
    modules: ["Icon", "FormGroup"],
    styles: _styles2.default,
    formComponent: true
});
//# sourceMappingURL=index.js.map
