"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _dynamics = require("dynamics.js");

var _dynamics2 = _interopRequireDefault(_dynamics);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var AnimationSets = (function() {
    function AnimationSets() {
        (0, _classCallCheck3.default)(this, AnimationSets);
    }

    (0, _createClass3.default)(AnimationSets, null, [
        {
            key: "fadeIn",
            value: function fadeIn(el, callback) {
                _dynamics2.default.animate(
                    el,
                    {
                        opacity: 1
                    },
                    {
                        type: _dynamics2.default.spring,
                        duration: 250,
                        complete: callback
                    }
                );
            }
        },
        {
            key: "fadeOut",
            value: function fadeOut(el, callback) {
                _dynamics2.default.animate(
                    el,
                    {
                        opacity: 0
                    },
                    {
                        type: _dynamics2.default.easeInOut,
                        duration: 250,
                        complete: callback
                    }
                );
            }
        },
        {
            key: "custom",
            value: function custom(anim, el, callback) {
                var options = [
                    "ease",
                    "duration",
                    "friction",
                    "frequency",
                    "bounciness",
                    "elasticity"
                ];

                _dynamics2.default.animate(
                    el,
                    (0, _omit3.default)(anim, options),
                    Object.assign(
                        {
                            type: _dynamics2.default[(0, _get3.default)(anim, "ease", "easeIn")],
                            complete: callback
                        },
                        (0, _pick3.default)(anim, options)
                    )
                );
            }
        }
    ]);
    return AnimationSets;
})();

exports.default = AnimationSets;
//# sourceMappingURL=AnimationSets.js.map
