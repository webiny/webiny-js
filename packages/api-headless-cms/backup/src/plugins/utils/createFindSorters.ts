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

        acc[key] = dir === "ASC" ? 1 : -1;

        return acc;
    }, {});
}
