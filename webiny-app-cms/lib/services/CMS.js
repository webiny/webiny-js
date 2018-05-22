"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var CMS = (function() {
    function CMS() {
        (0, _classCallCheck3.default)(this, CMS);

        this.widgets = [];
    }
    /**
     * @private
     */

    (0, _createClass3.default)(CMS, [
        {
            key: "addWidget",
            value: function addWidget(widget) {
                this.widgets.push(widget);
            }
        },
        {
            key: "getWidget",
            value: function getWidget(type) {
                return (0, _find3.default)(this.widgets, { type: type });
            }
        }
    ]);
    return CMS;
})();

exports.default = CMS;
//# sourceMappingURL=CMS.js.map
