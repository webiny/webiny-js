/**
 * Package short-hash has no types.
 */
// @ts-expect-error
import hash from "short-hash";

/**
 * Searches for all declared namespaces.
 * Result contains an object with identifiers as keys, and namespaces they represent as values, for example:
 * {ns1: 'Webiny.Ns1', ns2: 'Webiny.Ns2', i18n: 'NewNamespace', t: 'Some.Other.Namespace'}
 * @param source
 */
const getNamespaces = (source: string) => {
    const regex = /([a-zA-Z0-9]+)[ ]+=[ ]+i18n.namespace\(['"`]([a-zA-Z0-9.]+)['"`]\)/g;
    let m;

    const results: Record<string, string> = {};

    while ((m = regex.exec(source)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        results[m[1]] = m[2];
    }

    return results;
};

export default (source: string) => {
    const results: Record<string, string> = {};
    const allDeclaredNamespaces = getNamespaces(source);

    for (const variable in allDeclaredNamespaces) {
        const regex = new RegExp(variable + "`(.*?)`", "g");

        let m;
        while ((m = regex.exec(source)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // This is the key - namespace + hash of matched label.
            const matchedText = m[1];
            const key = allDeclaredNamespaces[variable] + "." + hash(matchedText);
            results[key] = matchedText;
        }
    }

    return results;
};
