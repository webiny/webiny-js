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

var _webinyClient = require("webiny-client");

var _EditableTranslation = require("./EditableTranslation.scss");

var _EditableTranslation2 = _interopRequireDefault(_EditableTranslation);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace  Webiny.Backend.I18N.EditableTranslation
 */
var EditableTranslation = (function(_Webiny$Ui$Component) {
    (0, _inherits3.default)(EditableTranslation, _Webiny$Ui$Component);

    function EditableTranslation(props) {
        (0, _classCallCheck3.default)(this, EditableTranslation);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (EditableTranslation.__proto__ || Object.getPrototypeOf(EditableTranslation)).call(this)
        );

        _this.ref = null;
        _this.state = _lodash2.default.assign({}, props, { edit: false });
        _this.bindMethods("showForm,hideForm");
        return _this;
    }

    (0, _createClass3.default)(EditableTranslation, [
        {
            key: "showForm",
            value: function showForm() {
                var _this2 = this;

                this.setState({ edit: true });
                setTimeout(function() {
                    return _this2.ref.querySelector("textarea").focus();
                }, 100);
            }
        },
        {
            key: "hideForm",
            value: function hideForm() {
                this.setState({ edit: false });
            }
        }
    ]);
    return EditableTranslation;
})(_webinyClient.Webiny.Ui.Component);

EditableTranslation.defaultProps = {
    locale: null,
    text: null,
    translation: null,
    renderer: function renderer() {
        var _this3 = this;

        var Ui = this.props.Ui;
        var _state = this.state,
            text = _state.text,
            locale = _state.locale,
            translation = _state.translation,
            edit = _state.edit;

        var translationText = _lodash2.default.get(translation, "text");
        if (_lodash2.default.isEmpty(translationText)) {
            translationText = _react2.default.createElement(
                "div",
                { className: _EditableTranslation2.default.noTranslationLabel },
                this.i18n("No translation")
            );
        } else {
            translationText = _react2.default.createElement("div", null, translationText);
        }

        return _react2.default.createElement(
            "div",
            {
                ref: function ref(_ref3) {
                    return (_this3.ref = _ref3);
                },
                className: _EditableTranslation2.default.editableTranslation,
                onClick: edit ? _lodash2.default.noop : this.showForm
            },
            _react2.default.createElement(
                "label",
                null,
                !_lodash2.default.isEmpty(_lodash2.default.get(translation, "text")) &&
                    _react2.default.createElement(Ui.Icon, { icon: "icon-check" }),
                locale.label
            ),
            this.state.edit
                ? _react2.default.createElement(
                      Ui.Form,
                      {
                          defaultModel: {
                              locale: locale.key,
                              text: _lodash2.default.get(translation, "text")
                          },
                          api: "/entities/webiny/i18n-texts",
                          onSubmit: function onSubmit(_ref) {
                              var model = _ref.model,
                                  form = _ref.form;

                              _this3.hideForm();
                              model.text = _lodash2.default.trim(model.text);
                              _this3.setState(
                                  { translation: model },
                                  (0, _asyncToGenerator3.default)(
                                      /*#__PURE__*/ _regenerator2.default.mark(function _callee() {
                                          var response;
                                          return _regenerator2.default.wrap(
                                              function _callee$(_context) {
                                                  while (1) {
                                                      switch ((_context.prev = _context.next)) {
                                                          case 0:
                                                              _context.next = 2;
                                                              return form.api.patch(
                                                                  "/" + text.id + "/translations",
                                                                  model
                                                              );

                                                          case 2:
                                                              response = _context.sent;

                                                              if (!response.isError()) {
                                                                  _context.next = 6;
                                                                  break;
                                                              }

                                                              _this3.showForm();
                                                              return _context.abrupt(
                                                                  "return",
                                                                  _webinyClient.Webiny.Growl.danger(
                                                                      response.getMessage()
                                                                  )
                                                              );

                                                          case 6:
                                                              _webinyClient.Webiny.Growl.success(
                                                                  _this3.i18n(
                                                                      "Translation successfully saved!"
                                                                  )
                                                              );

                                                          case 7:
                                                          case "end":
                                                              return _context.stop();
                                                      }
                                                  }
                                              },
                                              _callee,
                                              _this3
                                          );
                                      })
                                  )
                              );
                          }
                      },
                      function() {
                          var shortcut =
                              navigator.platform === "MacIntel" ? "Cmd + Enter" : "Ctrl + Enter";
                          return _react2.default.createElement(Ui.Textarea, {
                              placeholder: _this3.i18n(
                                  "Press {shortcut} to save translation or Esc to cancel",
                                  { shortcut: shortcut }
                              ),
                              name: "text",
                              onKeyUp: function onKeyUp(event) {
                                  return event.key === "Escape" && _this3.hideForm();
                              }
                          });
                      }
                  )
                : translationText
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(EditableTranslation, {
    modulesProp: "Ui",
    modules: ["Form", "Textarea", "Form", "Icon"]
});
//# sourceMappingURL=EditableTranslation.js.map
