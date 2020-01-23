export default location => {
    const params: { [key: string]: any } = {};

    if (location) {
        const query = new URLSearchParams(location.search);

        const page = query.get("page");
        const perPage = query.get("perPage");

        if (page) {
            params.page = parseInt(page);
        }

        if (perPage) {
            params.perPage = parseInt(perPage);
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
