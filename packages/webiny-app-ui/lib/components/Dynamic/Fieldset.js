"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

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

var _set2 = require("lodash/set");

var _set3 = _interopRequireDefault(_set2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _values2 = require("lodash/values");

var _values3 = _interopRequireDefault(_values2);

var _cloneDeep2 = require("lodash/cloneDeep");

var _cloneDeep3 = _interopRequireDefault(_cloneDeep2);

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _has2 = require("lodash/has");

var _has3 = _interopRequireDefault(_has2);

var _isArray2 = require("lodash/isArray");

var _isArray3 = _interopRequireDefault(_isArray2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _Row = require("./Row");

var _Row2 = _interopRequireDefault(_Row);

var _Header = require("./Header");

var _Header2 = _interopRequireDefault(_Header);

var _Empty = require("./Empty");

var _Empty2 = _interopRequireDefault(_Empty);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function insertKey(data) {
    if (!data) {
        data = [];
    }

    var model = {};
    (0, _each3.default)(data, function(object, i) {
        if ((0, _isArray3.default)(object)) {
            object = {};
        }
        if (!(0, _has3.default)(object, "$key")) {
            var $key = (0, _uniqueId3.default)("dynamic-fieldset-");
            object["$key"] = $key;
            model[$key] = object;
        } else {
            model[object["$key"]] = object;
        }
        model[object["$key"]]["$index"] = i;
    });

    return model;
}

var Fieldset = (function(_React$Component) {
    (0, _inherits3.default)(Fieldset, _React$Component);

    function Fieldset(props) {
        (0, _classCallCheck3.default)(this, Fieldset);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Fieldset.__proto__ || Object.getPrototypeOf(Fieldset)).call(this, props)
        );

        _this.state = Object.assign({}, props.initialState);

        _this.currentKey = 0;
        _this.rowTemplate = null;
        _this.headerTemplate = _noop3.default;
        _this.emptyTemplate = null;

        _this.actions = {
            add: function add() {
                var record =
                    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                return function() {
                    return _this.addData(record);
                };
            },
            remove: function remove(record) {
                return function() {
                    return _this.removeData(record);
                };
            }
        };

        ["parseLayout", "registerInputs", "registerInput", "addData", "removeData"].map(function(
            m
        ) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    (0, _createClass3.default)(Fieldset, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                this.setState({ model: insertKey((0, _cloneDeep3.default)(this.props.value)) });
                this.parseLayout(this.props.children);
            }
        },
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                if (this.props.attachToForm) {
                    this.props.attachToForm(this);
                }
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                if (props.form.isSubmitDisabled()) {
                    // prevent modifying model and updating keys if props are received during form submit
                    return;
                }

                this.setState({ model: insertKey((0, _cloneDeep3.default)(props.value)) });
                this.parseLayout(props.children);
            }
        },
        {
            key: "parseLayout",
            value: function parseLayout(children) {
                var _this2 = this;

                if (
                    (typeof children === "undefined"
                        ? "undefined"
                        : (0, _typeof3.default)(children)) !== "object" ||
                    children === null
                ) {
                    return children;
                }

                _react2.default.Children.map(children, function(child) {
                    if ((0, _webinyApp.isElementOfType)(child, _Row2.default)) {
                        _this2.rowTemplate = child.props.children;
                    }

                    if ((0, _webinyApp.isElementOfType)(child, _Header2.default)) {
                        _this2.headerTemplate = child.props.children;
                    }

                    if ((0, _webinyApp.isElementOfType)(child, _Empty2.default)) {
                        _this2.emptyTemplate = child.props.children;
                    }
                });
            }
        },
        {
            key: "removeData",
            value: function removeData(record) {
                delete this.state.model[record.$key];
                this.props.onChange((0, _values3.default)(this.state.model));
            }
        },
        {
            key: "addData",
            value: function addData() {
                var record =
                    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                var $key = (0, _uniqueId3.default)("dynamic-fieldset-");
                if (!record) {
                    this.state.model[$key] = { $key: $key };
                    this.props.onChange((0, _values3.default)(this.state.model));
                } else {
                    var model = (0, _values3.default)(this.state.model);
                    model.splice(record.$index + 1, 0, { $key: $key });
                    this.props.onChange(model);
                }
            }
        },
        {
            key: "registerInput",
            value: function registerInput(child) {
                var _this3 = this;

                if (
                    (typeof child === "undefined" ? "undefined" : (0, _typeof3.default)(child)) !==
                        "object" ||
                    child === null
                ) {
                    return child;
                }

                if (child.props && child.props.name) {
                    var $key = this.currentKey;
                    var newProps = (0, _assign3.default)({}, child.props, {
                        __tabs: this.props.__tabs,
                        attachToForm: this.props.attachToForm,
                        form: this.props.form,
                        value: (0, _get3.default)(this.state.model, $key + "." + child.props.name),
                        name: $key + "." + child.props.name,
                        onChange: function onChange(newValue) {
                            (0, _set3.default)(
                                _this3.state.model,
                                $key + "." + child.props.name,
                                newValue
                            );
                            _this3.props.onChange((0, _values3.default)(_this3.state.model));
                        }
                    });

                    return _react2.default.cloneElement(child, newProps);
                }
                return _react2.default.cloneElement(
                    child,
                    (0, _omit3.default)(child.props, ["key", "ref"]),
                    this.registerInputs(child.props && child.props.children)
                );
            }
        },
        {
            key: "registerInputs",
            value: function registerInputs(children) {
                if (
                    (typeof children === "undefined"
                        ? "undefined"
                        : (0, _typeof3.default)(children)) !== "object" ||
                    children === null
                ) {
                    return children;
                }
                return _react2.default.Children.map(children, this.registerInput);
            }
        },
        {
            key: "render",
            value: function render() {
                var _this4 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var model = this.state.model;

                if (Object.keys(model).length) {
                    return _react2.default.createElement(
                        "div",
                        null,
                        this.headerTemplate({ actions: this.actions }),
                        Object.keys(model).map(function(key) {
                            var record = model[key];
                            _this4.currentKey = key;
                            return _react2.default.createElement(
                                "webiny-dynamic-fieldset-row",
                                { key: key },
                                _this4.registerInputs(
                                    _this4.rowTemplate({ data: record, actions: _this4.actions })
                                )
                            );
                        })
                    );
                }

                return _react2.default.createElement(
                    "div",
                    null,
                    this.registerInputs(this.emptyTemplate({ actions: this.actions }))
                );
            }
        }
    ]);
    return Fieldset;
})(_react2.default.Component);

Fieldset.defaultProps = {
    defaultValue: []
};

exports.default = (0, _webinyApp.createComponent)([Fieldset, _webinyAppUi.FormComponent], {
    formComponent: true
});
//# sourceMappingURL=Fieldset.js.map
