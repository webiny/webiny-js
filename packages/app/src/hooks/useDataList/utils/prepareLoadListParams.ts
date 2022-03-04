interface Params {
    after?: string;
    before?: string;
    limit?: number;
    sort?: string;
    where?: Record<string, any>;
    search?: string;
}

export default (location: Location): Params => {
    const params: Record<string, string | number> = {};

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

        ["sort", "where", "search"].forEach(key => {
            const value = query.get(key);
            if (typeof value !== "string") {
                return;
            }
            try {
                params[key] = JSON.parse(value);
            } catch (e) {
                params[key] = value;
            }
        });
    }

    return params as Params;
};
