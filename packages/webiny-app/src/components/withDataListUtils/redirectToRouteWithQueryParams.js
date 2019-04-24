export default (params, { history, location }) => {
    const paramsClone = Object.assign({}, params);

    ["sort", "search", "where"].forEach(key => {
        if (typeof paramsClone[key] === "object") {
            paramsClone[key] = JSON.stringify(paramsClone[key]);
        }
    });

    const { perPage, page, where, search, sort } = paramsClone;

    const query = new URLSearchParams(location.search);
    query.set("perPage", perPage);
    query.set("page", page);
    query.set("where", where);
    query.set("search", search);
    query.set("sort", sort);

    history.push({ search: query.toString() });
};
