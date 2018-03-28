"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _pathToRegexp = require("path-to-regexp");

var _pathToRegexp2 = _interopRequireDefault(_pathToRegexp);

var _queryString = require("query-string");

var _queryString2 = _interopRequireDefault(_queryString);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var patternCache = {};
var cacheLimit = 10000;
var cacheCount = 0;

var compileGenerator = function compileGenerator(pattern) {
    var cacheKey = pattern;
    var cache = patternCache[cacheKey] || (patternCache[cacheKey] = {});

    if (cache[pattern]) return cache[pattern];

    var compiledGenerator = _pathToRegexp2.default.compile(pattern);

    if (cacheCount < cacheLimit) {
        cache[pattern] = compiledGenerator;
        cacheCount++;
    }

    return compiledGenerator;
};

/**
 * Public API for generating a URL pathname from a pattern and parameters.
 */
var generatePath = function generatePath() {
    var pattern = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "/";
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (pattern === "/") {
        return pattern;
    }
    var generator = compileGenerator(pattern);

    var patternParams = [];
    (0, _pathToRegexp2.default)(pattern, patternParams);

    var query = {};
    var paramKeys = Object.keys(params);
    paramKeys.map(function(p) {
        if (!(0, _find3.default)(patternParams, { name: p })) {
            query[p] = params[p];
        }
    });

    return generator(params) + "?" + _queryString2.default.stringify(query);
};

exports.default = generatePath;
//# sourceMappingURL=generatePath.js.map
