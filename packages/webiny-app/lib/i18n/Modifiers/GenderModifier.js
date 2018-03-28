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

var GenderModifier = (function() {
    function GenderModifier() {
        (0, _classCallCheck3.default)(this, GenderModifier);
    }

    (0, _createClass3.default)(GenderModifier, [
        {
            key: "getName",
            value: function getName() {
                return "gender";
            }
        },
        {
            key: "execute",
            value: function execute(value, parameters) {
                return value === "male" ? parameters[0] : parameters[1];
            }
        }
    ]);
    return GenderModifier;
})();

exports.default = GenderModifier;
//# sourceMappingURL=GenderModifier.js.map
