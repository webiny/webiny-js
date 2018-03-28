"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = hotAcceptLoader;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const regex = /import\((.+?)\)/g;
const files = [];

function hotAcceptLoader(source) {
    let m;
    const res = _path2.default.parse(this.resource);

    do {
        m = regex.exec(source);
        if (m) {
            let ip = m[1];
            ip = _lodash2.default.trim(ip, "'");
            ip = _lodash2.default.trim(ip, '"');

            files.push(_path2.default.join(res.dir, ip));
        }
    } while (m);

    if (files.includes(_path2.default.join(res.dir, res.name))) {
        source += "\nmodule.hot.accept(() => {})";
    }

    return source;
}
//# sourceMappingURL=index.js.map
