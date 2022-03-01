interface Params {
    sort: string;
    search: string;
    where: Record<string, any>;
}
interface Location {
    search: string;
}
interface Options {
    history: Location[];
    location: Location;
}
export default (params: Params, options: Options): void => {
    const { history, location } = options;
    const paramsClone: Record<string, any> = Object.assign({}, params);

    ["sort", "search", "where"].forEach(key => {
        if (typeof paramsClone[key] === "object") {
            paramsClone[key] = JSON.stringify(paramsClone[key]);
        }
    });

    const keys: string[] = ["limit", "after", "before", "where", "search", "sort"];

    const query = new URLSearchParams(location.search);
    keys.forEach(key => {
        if (typeof paramsClone[key] !== "undefined") {
            query.set(key, paramsClone[key]);
        } else {
            query.delete(key);
        }
    });

    history.push({ search: query.toString() });
};
