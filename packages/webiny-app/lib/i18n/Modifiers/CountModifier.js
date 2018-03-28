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

var CountModifier = (function() {
    function CountModifier() {
        (0, _classCallCheck3.default)(this, CountModifier);
    }

    (0, _createClass3.default)(CountModifier, [
        {
            key: "getName",
            value: function getName() {
                return "count";
            }
        },
        {
            key: "execute",
            value: function execute(value, parameters) {
                // Numbers can be single number or ranges.
                for (var i = 0; i < parameters.length; i = i + 2) {
                    var current = parameters[i];
                    if (current === "default") {
                        return value + " " + parameters[i + 1];
                    }

                    var numbers = current.split("-");

                    // If we are dealing with a numbers range, then let's check if we are in it.
                    if (numbers.length === 2) {
                        if (value >= numbers[0] && value <= numbers[1]) {
                            return value + " " + parameters[i + 1];
                        }
                        continue;
                    }

                    if (value === numbers[0]) {
                        return value + " " + parameters[i + 1];
                    }
                }

                // If we didn't match any condition, let's just remove the received value.
                return value;
            }
        }
    ]);
    return CountModifier;
})();

exports.default = CountModifier;
//# sourceMappingURL=CountModifier.js.map
