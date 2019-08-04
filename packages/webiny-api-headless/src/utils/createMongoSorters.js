/**
 * Built-in fields are not part of the content model.
 *
 * @param model
 * @param fieldId
 * @returns {boolean}
 */
function isBuiltIn(model, fieldId) {
    return !model.fields.find(f => f.fieldId === fieldId);
}

/**
 * Create sorters object suitable for Mongo
 *
 * @param model
 * @param sort
 * @returns {*}
 */
export default function createMongoSorters(model, sort) {
    if (!sort) {
        return null;
    }

    return sort.reduce((acc, item) => {
        const [key, dir] = item.split("_");

        if (isBuiltIn(model, key)) {
            acc[key] = dir === "ASC" ? 1 : -1;
        } else {
            acc[`${key}.value`] = dir === "ASC" ? 1 : -1;
        }

        return acc;
    }, {});
}
