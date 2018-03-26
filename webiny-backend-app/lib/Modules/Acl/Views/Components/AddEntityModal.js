"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _webinyClient = require("webiny-client");

var _matchOption = require("./matchOption");

var _matchOption2 = _interopRequireDefault(_matchOption);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Acl.AddEntityModal
 */
var AddEntityModal = (function(_Webiny$Ui$ModalCompo) {
    (0, _inherits3.default)(AddEntityModal, _Webiny$Ui$ModalCompo);

    function AddEntityModal() {
        (0, _classCallCheck3.default)(this, AddEntityModal);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (AddEntityModal.__proto__ || Object.getPrototypeOf(AddEntityModal)).call(this)
        );

        _this.api = new _webinyClient.Webiny.Api.Endpoint("/services/webiny/entities");
        return _this;
    }

    (0, _createClass3.default)(AddEntityModal, [
        {
            key: "renderDialog",
            value: function renderDialog() {
                var _this2 = this;

                var _props = this.props,
                    Modal = _props.Modal,
                    Form = _props.Form,
                    Grid = _props.Grid,
                    Select = _props.Select,
                    Button = _props.Button;

                return _react2.default.createElement(Modal.Dialog, null, function(_ref) {
                    var dialog = _ref.dialog;
                    return _react2.default.createElement(
                        Form,
                        {
                            onSubmit: (function() {
                                var _ref3 = (0, _asyncToGenerator3.default)(
                                    /*#__PURE__*/ _regenerator2.default.mark(function _callee(
                                        _ref2
                                    ) {
                                        var model = _ref2.model,
                                            form = _ref2.form;
                                        var query, apiResponse;
                                        return _regenerator2.default.wrap(
                                            function _callee$(_context) {
                                                while (1) {
                                                    switch ((_context.prev = _context.next)) {
                                                        case 0:
                                                            form.showLoading();
                                                            query = {
                                                                details: "methods",
                                                                crudMethods: true,
                                                                classId: model.entity
                                                            };
                                                            _context.next = 4;
                                                            return _this2.api.setQuery(query).get();

                                                        case 4:
                                                            apiResponse = _context.sent;

                                                            form.hideLoading();
                                                            _context.next = 8;
                                                            return dialog.hide();

                                                        case 8:
                                                            _this2.props.onSubmit(
                                                                apiResponse.getData()
                                                            );

                                                        case 9:
                                                        case "end":
                                                            return _context.stop();
                                                    }
                                                }
                                            },
                                            _callee,
                                            _this2
                                        );
                                    })
                                );

                                return function(_x) {
                                    return _ref3.apply(this, arguments);
                                };
                            })()
                        },
                        function(_ref4) {
                            var form = _ref4.form;
                            return _react2.default.createElement(
                                Modal.Content,
                                null,
                                _react2.default.createElement(Modal.Header, {
                                    title: _this2.i18n("Add entity"),
                                    onClose: dialog.hide
                                }),
                                _react2.default.createElement(
                                    Modal.Body,
                                    null,
                                    _react2.default.createElement(
                                        Grid.Row,
                                        null,
                                        _react2.default.createElement(
                                            Grid.Col,
                                            { all: 12 },
                                            _react2.default.createElement(Form.Error, null),
                                            _react2.default.createElement(Form.Loader, null),
                                            _react2.default.createElement(Select, {
                                                description: _this2.i18n(
                                                    "Entities already added are not shown."
                                                ),
                                                placeholder: _this2.i18n("Select entity..."),
                                                name: "entity",
                                                validate: "required",
                                                api: "/services/webiny/entities",
                                                query: {
                                                    exclude: _this2.props.exclude.map(function(
                                                        item
                                                    ) {
                                                        return item.classId;
                                                    })
                                                },
                                                valueAttr: "classId",
                                                textAttr: "classId",
                                                matcher: _matchOption2.default,
                                                optionRenderer: function optionRenderer(_ref5) {
                                                    var option = _ref5.option;
                                                    return _react2.default.createElement(
                                                        "div",
                                                        null,
                                                        _react2.default.createElement(
                                                            "strong",
                                                            null,
                                                            option.data.classId
                                                        ),
                                                        _react2.default.createElement("br", null),
                                                        option.data.class
                                                    );
                                                },
                                                selectedRenderer: function selectedRenderer(_ref6) {
                                                    var option = _ref6.option;
                                                    return option.data.classId;
                                                },
                                                minimumResultsForSearch: 5
                                            })
                                        )
                                    )
                                ),
                                _react2.default.createElement(
                                    Modal.Footer,
                                    null,
                                    _react2.default.createElement(Button, {
                                        label: _this2.i18n("Cancel"),
                                        onClick: _this2.hide
                                    }),
                                    _react2.default.createElement(Button, {
                                        type: "primary",
                                        label: _this2.i18n("Add"),
                                        onClick: form.submit
                                    })
                                )
                            );
                        }
                    );
                });
            }
        }
    ]);
    return AddEntityModal;
})(_webinyClient.Webiny.Ui.ModalComponent);

AddEntityModal.defaultProps = _lodash2.default.assign(
    {},
    _webinyClient.Webiny.Ui.ModalComponent.defaultProps,
    {
        onSubmit: _lodash2.default.noop,
        exclude: []
    }
);

exports.default = _webinyClient.Webiny.createComponent(AddEntityModal, {
    modules: ["Modal", "Form", "Grid", "Select", "Button"]
});
//# sourceMappingURL=AddEntityModal.js.map
