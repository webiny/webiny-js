export default location => {
    const params: { [key: string]: any } = {};

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
            if (typeof query.get(key) === "string") {
                try {
                    params[key] = JSON.parse(query.get(key));
                } catch (e) {
                    params[key] = query.get(key);
                }
            }
        });
    }

    return params;
};
