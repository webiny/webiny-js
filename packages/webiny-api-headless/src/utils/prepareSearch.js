export default function prepareSearch(search) {
    // Here we handle search (if passed) - we transform received arguments into linked LIKE statements.
    const { query, operator, fields } = search || {};

    if (!query) {
        return {};
    }

    const searches = [];
    fields.forEach(field => {
        searches.push({ [field]: { $regex: `.*${query}.*`, $options: "i" } });
    });

    return {
        [operator === "and" ? "$and" : "$or"]: searches
    };
}
