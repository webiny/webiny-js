"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

require("./styles.scss?extract");

var _codemirror = require("codemirror");

var _codemirror2 = _interopRequireDefault(_codemirror);

require("codemirror-formatting");

require("codemirror/mode/xml/xml");

require("codemirror/mode/css/css");

require("codemirror/mode/javascript/javascript");

require("codemirror/mode/jsx/jsx");

require("codemirror/mode/clike/clike");

require("codemirror/mode/php/php");

require("codemirror/mode/yaml/yaml");

require("codemirror/mode/htmlmixed/htmlmixed");

require("codemirror/mode/shell/shell");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = _codemirror2.default;
//# sourceMappingURL=index.js.map
