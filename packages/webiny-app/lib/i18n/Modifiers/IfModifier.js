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

var IfModifier = (function() {
    function IfModifier() {
        (0, _classCallCheck3.default)(this, IfModifier);
    }

    (0, _createClass3.default)(IfModifier, [
        {
            key: "getName",
            value: function getName() {
                return "gender";
            }
        },
        {
            key: "execute",
            value: function execute(value, parameters) {
                return value === parameters[0] ? parameters[1] : parameters[2] || "";
            }
        }
    ]);
    return IfModifier;
})();

exports.default = IfModifier;
//# sourceMappingURL=IfModifier.js.map
