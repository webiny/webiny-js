"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _objectWithoutProperties2 = require("babel-runtime/helpers/objectWithoutProperties");

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _jimp = require("jimp");

var _jimp2 = _interopRequireDefault(_jimp);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = () => {
    return (() => {
        var _ref = (0, _asyncToGenerator3.default)(function*(params) {
            const { image, transformations } = params;
            let img = yield _jimp2.default.read(image);
            const AUTO = _jimp2.default.AUTO;

            for (let i = 0; i < transformations.length; i++) {
                const _transformations$i = transformations[i],
                    { action } = _transformations$i,
                    params = (0, _objectWithoutProperties3.default)(_transformations$i, ["action"]);
                let { width, height, x, y } = params;

                switch (action) {
                    case "resize":
                        img = yield img.resize(width || AUTO, height || AUTO);
                        break;
                    case "crop":
                        img = yield img.crop(x || AUTO, y || AUTO, width || AUTO, height || AUTO);
                        break;
                    case "quality":
                        yield img.quality(params.quality);
                        break;
                }
            }

            return new _promise2.default(function(resolve) {
                return img.getBuffer(AUTO, function(err, buffer) {
                    resolve(buffer);
                });
            });
        });

        return function(_x) {
            return _ref.apply(this, arguments);
        };
    })();
};
//# sourceMappingURL=index.js.map
