"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Generate URL using given Array<{test: RegEx, domain: string}> set of rules.
 * This is useful when you want your production assets to be served form different domains
 * for different assets - to speed up your page load time.
 *
 * Example:
 * [
 *   {test: '^fonts\/', domain: 'http://fonts.domain.com/'},
 *   {test: '^chunks\/', domain: 'http://chunks.domain.com/'},
 *   {test: 'images\/', domain: 'http://images.domain.com/'},
 *   {test: '\.js$', domain: 'http://js.domain.com/'},
 *   {test: '\.css$', domain: 'http://css.domain.com/'}
 * ]
 *
 * @param assetRules
 * @return {string}
 */
class UrlGenerator {
    constructor() {
        this.rules = {};
    }

    setRules(rules) {
        this.rules = rules;
    }

    generate(file, prefix = "/") {
        _lodash2.default.each(this.rules, rule => {
            const regex = new RegExp(rule.test);
            if (regex.test(file)) {
                prefix = rule.domain + prefix;
                return false;
            }
        });

        return prefix + _lodash2.default.trimStart(file, "/");
    }
}

exports.default = UrlGenerator;
//# sourceMappingURL=urlGenerator.js.map
