"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Data extractor class.
 */
class DataExtractor {
    /**
     * Returns extracted data.
     * @param data    Data object on which the extraction will be performed.
     * @param keys    Comma-separated keys which need to be extracted. For nested keys, dot and square brackets notation is available.
     * @param options    Extraction options.
     * @returns {Promise<Object>}
     */
    get(data, keys = "", options = {}) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            // First we remove all breaks from the string.
            keys = keys.replace(/\s/g, "").trim();

            // Recursively processes all root and nested keys.
            return _this.__process({ data, keys }, options).then(function({ output }) {
                return output;
            });
        })();
    }

    /**
     * Processes given params with given extraction options. Can be called recursively on nested data.
     * @param params     Contains data, keys, initial path and output object.
     * @param options    Various options, eg. onRead callback or ability to still include keys with undefined values.
     * @returns {Promise<ExtractedData>}
     * @private
     */
    __process(params, options = {}) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const { data, keys = "", output = {}, initialPath = [] } = params;
            let key = "",
                characters = 0,
                currentPath = initialPath.slice(0);
            outerLoop: for (let i = 0; i <= keys.length; i++) {
                const current = keys[i];
                if (typeof current !== "undefined") {
                    characters++;
                }
                switch (true) {
                    case current === ",":
                    case typeof current === "undefined": {
                        key &&
                            (yield _this2.__modifyOutput(
                                { output, key, data, path: currentPath },
                                options
                            ));
                        key = "";
                        currentPath = initialPath.slice(0);
                        break;
                    }
                    case current === "]": {
                        key &&
                            (yield _this2.__modifyOutput(
                                { output, key, data, path: currentPath },
                                options
                            ));
                        break outerLoop;
                    }
                    case current === "[": {
                        const path = currentPath.splice(0);
                        path.push(key);
                        const nested = yield _this2.__process(
                            {
                                data,
                                initialPath: path,
                                keys: keys.substr(i + 1),
                                output
                            },
                            options
                        );
                        characters += nested.processed.characters;
                        i += nested.processed.characters;
                        key = "";
                        break;
                    }
                    case current === ".":
                        currentPath.push(key);
                        key = "";
                        break;
                    default:
                        key += current;
                }
            }

            return {
                output,
                processed: { characters }
            };
        })();
    }

    /**
     * Directly modifies final output object with extracted data. Can be called recursively on nested data.
     * @param params
     * @param options
     * @returns {Promise<void>}
     * @private
     */
    __modifyOutput(params = {}, options = {}) {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const { output, data = {}, key = "", path = [] } = params;

            if (_lodash2.default.isEmpty(key)) {
                return;
            }

            const fragments = { output, data };

            // If current data fragment is not an object or in other words, a value where we cannot do something like x[y],
            // then we return immediately. For example if this was null, trying to do null[y] would throw an error.
            if (!_lodash2.default.isObject(fragments.data)) {
                return;
            }

            // Path is an array with keys that we need to go over. For example, company.image.src would have two
            // items in path array: 'company' and 'image', so we must first read these.

            // If we reached the last key (or if only one key was passed), then we just modify the output and exit.
            if (path.length === 0) {
                const final = { value: undefined, key };
                if (typeof options.onRead === "function") {
                    const results = yield options.onRead(data, key);
                    final.key = results[0];
                    final.value = results[1];
                } else {
                    final.value = yield data[key];
                }

                if (typeof final.value === "undefined") {
                    if (options.includeUndefined === true) {
                        fragments.output[final.key] = final.value;
                    }
                } else {
                    fragments.output[final.key] = final.value;
                }

                return;
            }

            // If we have keys that we need go over, let's take the first one.
            for (let i = 0; i < path.length; i++) {
                const step = path[i];

                // If we don't have a key assigned in our output object, let's assign a default value to it.
                // We read the value in received data, and if it's an array, that means we need to iterate and
                // apply reading of received keys on each one.
                const currentStepData = yield fragments.data[step];
                if (typeof fragments.output[step] === "undefined") {
                    switch (true) {
                        case _lodash2.default.isArray(currentStepData):
                            fragments.output[step] = [];
                            break;
                        case _lodash2.default.isObject(currentStepData):
                            fragments.output[step] = {};
                            break;
                        default:
                            fragments.output[step] = currentStepData;
                    }
                }

                // If value is an array, let's iterate over each and apply reading multiple times.
                if (_lodash2.default.isArray(currentStepData)) {
                    for (let j = 0; j < currentStepData.length; j++) {
                        if (typeof fragments.output[step][j] === "undefined") {
                            fragments.output[step][j] = {};
                        }

                        yield _this3.__modifyOutput(
                            {
                                output: fragments.output[step][j],
                                path: path.slice(i + 1),
                                key,
                                data: currentStepData[j]
                            },
                            options
                        );
                    }

                    break;
                }

                fragments.output = yield fragments.output[step];
                fragments.data = yield fragments.data[step];

                yield _this3.__modifyOutput(
                    {
                        output: fragments.output,
                        data: fragments.data,
                        path: path.slice(i + 1),
                        key
                    },
                    options
                );
            }
        })();
    }
}
exports.default = new DataExtractor();
//# sourceMappingURL=index.js.map
