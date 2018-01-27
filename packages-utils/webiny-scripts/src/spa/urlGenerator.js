const _ = require("lodash");

/**
 * Generate URL using given Array<{test: RegEx, domain: string}> set of rules.
 * This is useful when you want your production assets to be served form different domains
 * for different assets - to speed up your page load time.
 *
 * Example:
 * [
 *   {test: '^fonts\/', domain: 'http://fonts.domain.com'},
 *   {test: '^chunks\/', domain: 'http://chunks.domain.com'},
 *   {test: 'images\/', domain: 'http://images.domain.com'},
 *   {test: '\.js$', domain: 'http://js.domain.com'},
 *   {test: '\.css$', domain: 'http://css.domain.com'}
 * ]
 *
 * @param assetRules
 * @return {string}
 */
module.exports = class UrlGenerator {
    constructor() {
        this.rules = {};
    }

    setRules(rules) {
        this.rules = rules;
    }

    generate(file, prefix = "") {
        _.each(this.rules, rule => {
            const regex = new RegExp(rule.test);
            if (regex.test(file)) {
                prefix = rule.domain + prefix;
                return false;
            }
        });

        return _.trimEnd(prefix, "/") + "/" + _.trimStart(file, "/");
    }
};
