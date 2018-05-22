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

var EditorWidget = (function() {
    function EditorWidget() {
        // Here for future upgrades

        (0, _classCallCheck3.default)(this, EditorWidget);
    }

    (0, _createClass3.default)(EditorWidget, [
        {
            key: "makeLocal",
            value: function makeLocal(_ref) {
                var widget = _ref.widget;

                return Promise.resolve(widget);
            }

            // eslint-disable-next-line
        },
        {
            key: "removeWidget",
            value: function removeWidget(widget) {
                return Promise.resolve();
            }
        },
        {
            key: "renderWidget",
            value: function renderWidget() {
                throw new Error('Implement "renderWidget" method in your editor widget class!');
            }
        },
        {
            key: "renderSettings",
            value: function renderSettings() {
                return null;
            }
        }
    ]);
    return EditorWidget;
})();

exports.default = EditorWidget;
//# sourceMappingURL=EditorWidget.js.map
