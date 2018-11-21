// @flow
import typeof { router as Router } from "webiny-app/router";

export default (router: ?Router) => {
    const params = {};
    if (router) {
        const { page, perPage } = router.match.query;
        if (page) {
            params.page = page;
        }

        if (perPage) {
            params.perPage = perPage;
        }

        ["sort", "where", "search"].forEach(key => {
            if (!router) {
                return;
            }

            if (typeof router.match.query[key] === "string") {
                try {
                    params[key] = JSON.parse(router.match.query[key]);
                } catch (e) {
                    params[key] = router.match.query[key];
                }
            }
        });
    }

    return params;
};
