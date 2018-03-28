"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _webinyModel = require("webiny-model");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class BufferAttribute extends _webinyModel.Attribute {
    constructor(name, encoding) {
        super(name);
        this.encoding = encoding;
    }

    validateType(value) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (value instanceof Buffer) {
                return;
            }

            if (typeof value === "string" && value.startsWith("data:")) {
                return;
            }

            _this.expected("Buffer or data URI string", typeof value);
        })();
    }

    // $FlowIgnore
    setValue(value) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (typeof value === "string") {
                value = Buffer.from(value.split(",").pop(), _this2.encoding);
            }
            return _webinyModel.Attribute.prototype.setValue.call(_this2, value);
        })();
    }
}
exports.default = BufferAttribute;
//# sourceMappingURL=bufferAttribute.js.map
