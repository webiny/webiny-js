"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _webiny = require("webiny");

var _webiny2 = _interopRequireDefault(_webiny);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var DateModifier = (function() {
    function DateModifier() {
        (0, _classCallCheck3.default)(this, DateModifier);
    }

    (0, _createClass3.default)(DateModifier, [
        {
            key: "getName",
            value: function getName() {
                return "date";
            }
        },
        {
            key: "execute",
            value: function execute(value) {
                return _webiny2.default.I18n.date(value);
            }
        }
    ]);
    return DateModifier;
})();

exports.default = DateModifier;
//# sourceMappingURL=DateModifier.js.map
