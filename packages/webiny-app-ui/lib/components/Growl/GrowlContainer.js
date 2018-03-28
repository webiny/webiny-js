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

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _findIndex2 = require("lodash/findIndex");

var _findIndex3 = _interopRequireDefault(_findIndex2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _dynamics = require("dynamics.js");

var _dynamics2 = _interopRequireDefault(_dynamics);

var _webinyApp = require("webiny-app");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var GrowlContainer = (function(_React$Component) {
    (0, _inherits3.default)(GrowlContainer, _React$Component);

    function GrowlContainer(props) {
        (0, _classCallCheck3.default)(this, GrowlContainer);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (GrowlContainer.__proto__ || Object.getPrototypeOf(GrowlContainer)).call(this, props)
        );

        _this.state = {
            growls: []
        };

        _this.dom = {};
        _this.addGrowl = _this.addGrowl.bind(_this);
        _this.removeGrowl = _this.removeGrowl.bind(_this);
        _this.removeById = _this.removeById.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(GrowlContainer, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                this.props.onComponentDidMount(this);
            }
        },
        {
            key: "addGrowl",
            value: function addGrowl(growl) {
                var growlIndex = -1;
                if (growl.props.id) {
                    growlIndex = (0, _findIndex3.default)(this.state.growls, function(g) {
                        return g.props.id === growl.props.id;
                    });
                }

                if (growlIndex > -1) {
                    this.state.growls[growlIndex] = growl;
                } else {
                    if (!growl.props.id) {
                        growl = _react2.default.cloneElement(growl, {
                            id: (0, _uniqueId3.default)("growl-")
                        });
                    }
                    this.state.growls.push(growl);
                }
                this.setState({ growls: this.state.growls });
                return growl.props.id;
            }
        },
        {
            key: "removeById",
            value: function removeById(id) {
                this.refs[id] && this.removeGrowl(this.refs[id]);
            }
        },
        {
            key: "removeGrowl",
            value: function removeGrowl(growl) {
                var _this2 = this;

                var id = growl.props.id;

                _dynamics2.default.animate(
                    this.dom[id],
                    {
                        opacity: 0
                    },
                    {
                        type: _dynamics2.default.easeOut,
                        duration: 400,
                        complete: function complete() {
                            var index = (0, _findIndex3.default)(_this2.state.growls, function(
                                item
                            ) {
                                return item.props.id === id;
                            });
                            _this2.state.growls.splice(index, 1);
                            _this2.setState({ growls: _this2.state.growls });
                        }
                    }
                );
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                return _react2.default.createElement(
                    "div",
                    {
                        className: (0, _classnames2.default)(
                            _styles2.default.growl,
                            _styles2.default.topRight
                        )
                    },
                    _react2.default.createElement("div", {
                        className: _styles2.default.notification
                    }),
                    this.state.growls.map(function(growl) {
                        return _react2.default.cloneElement(growl, {
                            ref: growl.props.id,
                            onRef: function onRef(ref) {
                                return (_this3.dom[growl.props.id] = ref);
                            },
                            key: growl.props.id,
                            onRemove: _this3.removeGrowl
                        });
                    })
                );
            }
        }
    ]);
    return GrowlContainer;
})(_react2.default.Component);

GrowlContainer.defaultProps = {
    onComponentDidMount: _noop3.default
};

exports.default = (0, _webinyApp.createComponent)(GrowlContainer, { styles: _styles2.default });
//# sourceMappingURL=GrowlContainer.js.map
