"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extract = require("./extract");

var _extract2 = _interopRequireDefault(_extract);

var _glob = require("glob");

var _glob2 = _interopRequireDefault(_glob);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Extractor {
    setGlob(glob) {
        this.glob = glob;
        return this;
    }

    setContent(content) {
        this.content = content;
        return this;
    }

    execute() {
        const results = {};

        if (this.glob) {
            const paths = _glob2.default.sync(this.glob);
            paths.forEach(path => {
                console.log(path);
                const contents = _fs2.default.readFileSync(path, "utf8");
                const parsed = (0, _extract2.default)(contents);
                for (let key in parsed) {
                    results[key] = parsed[key];
                }
            });
        }

        console.log(results);
    }

    setListOnly(flag = true) {
        this.listOnly = flag;
        return this;
    }
}
exports.default = Extractor;
//# sourceMappingURL=index.js.map
