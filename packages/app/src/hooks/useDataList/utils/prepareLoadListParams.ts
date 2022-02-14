interface Params {
    after?: string;
    before?: string;
    limit?: number;
    sort?: string;
    where?: Record<string, any>;
    search?: string;
}

export default (location: Location) => {
    const params: Params = {};

    if (location) {
        const query = new URLSearchParams(location.search);

        const after = query.get("after");
        const before = query.get("before");
        const limit = query.get("limit");

        if (after) {
            params.after = after;
        }

        if (before) {
            params.before = before;
        }

        if (limit) {
            params.limit = parseInt(limit);
        }

        ["sort", "where", "search"].forEach((key: keyof Params) => {
            if (typeof query.get(key) === "string") {
                try {
                    params[key] = JSON.parse(query.get(key) as string);
                } catch (e) {
                    /**
                     * TODO @ts-refactor figure out what to set instead of any
                     */
                    params[key] = query.get(key) as any;
                }
            }
        });
    }

    return params;
};
