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

var _webinyClient = require("webiny-client");

var _styles = require("./../Views/styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Marketplace.InstallModal
 */
var InstallModal = (function(_Webiny$Ui$ModalCompo) {
    (0, _inherits3.default)(InstallModal, _Webiny$Ui$ModalCompo);

    function InstallModal(props) {
        (0, _classCallCheck3.default)(this, InstallModal);

        // started - installation has started
        // ended - API call has ended
        // finished - installation reached 100%

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (InstallModal.__proto__ || Object.getPrototypeOf(InstallModal)).call(this, props)
        );

        _this.state = { messages: [], started: false, ended: false, progress: 0, finished: false };

        _this.bindMethods("startUpdate,onClose");
        return _this;
    }

    (0, _createClass3.default)(InstallModal, [
        {
            key: "startUpdate",
            value: function startUpdate() {
                var _this2 = this;

                // Before we begin the update - we need to disable React Hot Loader to prevent possible errors during installation since webpack is still watching
                __REACT_HOT_LOADER__ = null;
                var Progress = this.props.Progress;

                this.setState({ started: true });
                var api = new _webinyClient.Webiny.Api.Endpoint("/services/webiny/marketplace");
                var currentResponseLength = false;

                // Add initial message
                var messages = this.state.messages;
                messages.push({ message: "Fetching app details...", id: 0 });
                this.setState({ messages: messages });

                api.setConfig({
                    downloadProgress: function downloadProgress(e) {
                        var response = e.currentTarget.response || "";
                        if (currentResponseLength === false) {
                            currentResponseLength = response.length;
                        } else {
                            var newLength = response.length;
                            response = response.substring(currentResponseLength);
                            currentResponseLength = newLength;
                        }

                        // We may receive multiple messages in a single line so we need to handle them using a delimiter
                        response
                            .split("_-_")
                            .filter(function(l) {
                                return l.length;
                            })
                            .map(function(line) {
                                try {
                                    var res = JSON.parse(line);
                                    if (res.roles) {
                                        _webinyClient.Webiny.Model.set(
                                            ["User", "roles"],
                                            res.roles
                                        );
                                    }

                                    if (res.progress) {
                                        _this2.setState(function(state) {
                                            var messages = state.messages;
                                            messages[0].message = _react2.default.createElement(
                                                Progress,
                                                { value: parseInt(res.progress) }
                                            );
                                            return {
                                                messages: messages,
                                                progress: parseInt(res.progress),
                                                finished: res.progress === 100
                                            };
                                        });
                                    }

                                    if (res.message) {
                                        _this2.setState(function(state) {
                                            var messages = state.messages;
                                            messages.unshift(res);
                                            return { messages: messages, lastId: res.id };
                                        });
                                    }
                                } catch (e) {}
                            });
                    }
                });

                return api.get("apps/" + this.props.app.id + "/install").then(function() {
                    _this2.setState({ ended: true });
                    if (_this2.state.finished) {
                        setTimeout(function() {
                            _this2.hide().then(function() {
                                return _this2.props.onUpdated();
                            });
                        }, 2000);
                    }
                });
            }
        },
        {
            key: "resetState",
            value: function resetState() {
                this.setState({
                    messages: [],
                    started: false,
                    ended: false,
                    progress: 0,
                    finished: false
                });
            }
        },
        {
            key: "show",
            value: function show() {
                this.resetState();
                return (0, _get3.default)(
                    InstallModal.prototype.__proto__ ||
                        Object.getPrototypeOf(InstallModal.prototype),
                    "show",
                    this
                ).call(this);
            }
        },
        {
            key: "onClose",
            value: function onClose() {
                if (!this.state.started || this.state.ended) {
                    this.hide();
                }
            }
        },
        {
            key: "renderDialog",
            value: function renderDialog() {
                var _this3 = this;

                var _props = this.props,
                    Modal = _props.Modal,
                    Button = _props.Button,
                    Link = _props.Link,
                    Grid = _props.Grid,
                    Logic = _props.Logic,
                    Alert = _props.Alert;

                return _react2.default.createElement(
                    Modal.Dialog,
                    {
                        closeOnClick: !this.state.started || this.state.ended,
                        onClose: this.onClose
                    },
                    _react2.default.createElement(
                        Modal.Content,
                        null,
                        _react2.default.createElement(Modal.Header, {
                            onClose: this.onClose,
                            title: this.i18n("Update")
                        }),
                        _react2.default.createElement(
                            Modal.Body,
                            null,
                            _react2.default.createElement(
                                Logic.Hide,
                                { if: this.state.started },
                                _react2.default.createElement(
                                    Alert,
                                    { type: "warning", title: this.i18n("Notice") },
                                    this.i18n(
                                        "Make sure your watch process is running before updating the app."
                                    )
                                ),
                                _react2.default.createElement(
                                    "div",
                                    { className: "text-center" },
                                    _react2.default.createElement(Button, {
                                        type: "primary",
                                        label: this.i18n("Begin Update"),
                                        onClick: this.startUpdate
                                    })
                                )
                            ),
                            _react2.default.createElement(
                                Logic.Hide,
                                { if: !this.state.started },
                                _react2.default.createElement(
                                    Logic.Show,
                                    { if: this.state.finished },
                                    _react2.default.createElement(
                                        Alert,
                                        { type: "success", title: this.i18n("Done") },
                                        this.i18n("Your app is updated!")
                                    )
                                ),
                                _react2.default.createElement(
                                    "pre",
                                    {
                                        style: { height: 500, overflow: "scroll", fontSize: 12 },
                                        ref: function ref(_ref) {
                                            return (_this3.logger = _ref);
                                        }
                                    },
                                    this.state.messages.map(function(m, i) {
                                        return _react2.default.createElement(
                                            "div",
                                            { key: m.id },
                                            m.message
                                        );
                                    })
                                )
                            )
                        ),
                        !this.state.finished &&
                            this.state.ended &&
                            _react2.default.createElement(
                                Modal.Footer,
                                null,
                                _react2.default.createElement(Button, {
                                    align: "right",
                                    label: this.i18n("Close"),
                                    onClick: this.hide
                                })
                            )
                    )
                );
            }
        }
    ]);
    return InstallModal;
})(_webinyClient.Webiny.Ui.ModalComponent);

exports.default = _webinyClient.Webiny.createComponent(InstallModal, {
    styles: _styles2.default,
    modules: ["Modal", "Button", "Link", "Grid", "Logic", "Alert", "Progress"]
});
//# sourceMappingURL=UpdateModal.js.map
