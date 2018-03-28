"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _shortHash = require("short-hash");

var _shortHash2 = _interopRequireDefault(_shortHash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Searches for all declared namespaces.
 * Result contains an object with identifiers as keys, and namespaces they represent as values, for example:
 * {ns1: 'Webiny.Ns1', ns2: 'Webiny.Ns2', i18n: 'NewNamespace', t: 'Some.Other.Namespace'}
 * @param source
 */
const getNamespaces = source => {
    const regex = /([a-zA-Z0-9]+)[ ]+=[ ]+i18n.namespace\(['"`]([a-zA-Z0-9.]+)['"`]\)/g;
    let m;

    const results = {};

    while ((m = regex.exec(source)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        results[m[1]] = m[2];
    }

    return results;
};

exports.default = source => {
    const results = {};
    const allDeclaredNamespaces = getNamespaces(source);

    for (let variable in allDeclaredNamespaces) {
        const regex = new RegExp(variable + "`(.*)`", "g");

        let m;
        while ((m = regex.exec(source)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // This is the key - namespace + hash of matched label.
            const matchedText = m[1];
            const key =
                allDeclaredNamespaces[variable] + "." + (0, _shortHash2.default)(matchedText);
            results[key] = matchedText;
        }
    }

    return results;
};
//# sourceMappingURL=extract.js.map
