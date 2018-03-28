"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ModalService = (function() {
    function ModalService() {
        (0, _classCallCheck3.default)(this, ModalService);

        this.modals = {};
    }

    (0, _createClass3.default)(ModalService, [
        {
            key: "show",
            value: function show(name) {
                return this.modals[name].show();
            }
        },
        {
            key: "hide",
            value: function hide(name) {
                return this.modals[name].hide();
            }
        },
        {
            key: "get",
            value: function get(name) {
                return this.modals[name];
            }
        },
        {
            key: "register",
            value: function register(name, instance) {
                this.modals[name] = instance;
            }
        },
        {
            key: "unregister",
            value: function unregister(name) {
                delete this.modals[name];
            }
        }
    ]);
    return ModalService;
})();

exports.default = ModalService;
//# sourceMappingURL=modal.js.map
