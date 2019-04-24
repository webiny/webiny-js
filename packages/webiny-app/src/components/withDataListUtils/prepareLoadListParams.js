export default location => {
    const params = {};
    if (location) {
        const query = new URLSearchParams(location.search);

        const page = query.get("page");
        const perPage = query.get("perPage");

        if (page) {
            params.page = page;
        }

        if (perPage) {
            params.perPage = perPage;
        }

        ["sort", "where", "search"].forEach(key => {
            if (!location) {
                return;
            }

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
