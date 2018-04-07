import pathToRegexp from "path-to-regexp";
import qs from "query-string";
import _ from "lodash";

const patternCache = {};
const cacheLimit = 10000;
let cacheCount = 0;

const compileGenerator = pattern => {
    const cacheKey = pattern;
    const cache = patternCache[cacheKey] || (patternCache[cacheKey] = {});

    if (cache[pattern]) return cache[pattern];

    const compiledGenerator = pathToRegexp.compile(pattern);

    if (cacheCount < cacheLimit) {
        cache[pattern] = compiledGenerator;
        cacheCount++;
    }

    return compiledGenerator;
};

/**
 * Public API for generating a URL pathname from a pattern and parameters.
 */
const generatePath = (pattern = "/", params = {}) => {
    if (pattern === "/") {
        return pattern;
    }
    const generator = compileGenerator(pattern);

    const patternParams = [];
    pathToRegexp(pattern, patternParams);

    const query = {};
    const paramKeys = Object.keys(params);
    paramKeys.map(p => {
        if (!_.find(patternParams, { name: p }) && !_.isNil(params[p]) && params[p] !== "") {
            query[p] = params[p];
        }
    });

    return generator(params) + "?" + qs.stringify(query);
};

export default generatePath;
