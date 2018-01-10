'use strict';

import _ from 'lodash';

/**
 * Returns an array with all detected namespaces in current file. Each namespace will have opening and closing tag positions.
 * @param source
 * @returns {Array}
 */
function getNamespaces(source) {
    const matches = [], regex = /@i18n\.namespace +([A-Za-z\.0-9]*)?/g;

    let match;
    while ((match = regex.exec(source))) {
        matches.push({index: match.index, name: match[1]});
    }

    const output = [];
    _.forEachRight(matches, match => {
        if (!match.name) {
            output.unshift({from: undefined, name: undefined, to: match.index});
            return true;
        }

        const index = _.findIndex(output, {from: undefined});
        if (index >= 0) {
            output[index].from = match.index;
            output[index].name = match.name;
        } else {
            output.unshift({name: match.name, from: match.index});
        }
    });

    return _.sortBy(output, 'from');
}

/**
 * Tells us to which i18n namespace current index belongs to.
 * @param index
 * @param namespaces
 * @returns {*}
 */
function getNamespaceOnIndex(index, namespaces) {
    let current = null;
    _.forEachRight(namespaces, namespace => {
        if (namespace.from < index && (!namespace.to || namespace.to > index)) {
            current = namespace.name;
            return false;
        }
    });
    return current;
}

export default  function (source) {
    const regex = {
        i18n: /this\.i18n\(['`"]/g,
        webinyI18n: /Webiny\.I18n\(['`"]/g
    };

    // Let's detect all defined i18n namespaces in source.
    const namespaces = getNamespaces(source);

    let occurrencesCount = 0;

    let match;
    while ((match = regex.i18n.exec(source))) {
        const namespace = getNamespaceOnIndex(match.index, namespaces);
        if (!namespace) {
            throw Error('Using "this.i18n" but namespace not defined.');
        }
        source = source.slice(0, match.index) + `this.i18n("${namespace}", ` + source.slice(match.index + 10);
        occurrencesCount++;
    }

    while ((match = regex.webinyI18n.exec(source))) {
        const namespace = getNamespaceOnIndex(match.index, namespaces);
        if (!namespace) {
            throw Error('Using "Webiny.I18n" but namespace not defined.');
        }
        source = source.slice(0, match.index) + `Webiny.I18n("${namespace}", ` + source.slice(match.index + 12);
        occurrencesCount++;
    }

    if (namespaces.length > 0 && occurrencesCount === 0) {
        throw Error('I18n namespace was defined but no usages found.');
    }

    return source;
};