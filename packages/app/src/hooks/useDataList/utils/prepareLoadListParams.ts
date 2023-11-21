interface Params {
    after?: string;
    before?: string;
    limit?: number;
    sort?: string;
    where?: Record<string, any>;
    search?: string;
}

const keys: (keyof Params)[] = ["sort", "where", "search"];

export default (location: Location): Params => {
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

        keys.forEach(key => {
            const value = query.get(key);
            if (typeof value !== "string") {
                return;
            }
            try {
                params[key] = JSON.parse(value);
            } catch (e) {
                params[key] = value as any;
            }
        });
    }

    return params as Params;
};
