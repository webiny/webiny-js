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

var TimeModifier = (function() {
    function TimeModifier() {
        (0, _classCallCheck3.default)(this, TimeModifier);
    }

    (0, _createClass3.default)(TimeModifier, [
        {
            key: "getName",
            value: function getName() {
                return "time";
            }
        },
        {
            key: "execute",
            value: function execute(value) {
                return _webiny2.default.I18n.time(value);
            }
        }
    ]);
    return TimeModifier;
})();

exports.default = TimeModifier;
//# sourceMappingURL=TimeModifier.js.map
