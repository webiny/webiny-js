// @flow
import type { WithDataListParams } from "./types";
import typeof { router as Router } from "webiny-app/router";

export default (withDataListParams: WithDataListParams, router: ?Router) => {
    const paramsClone = Object.assign({}, withDataListParams);
    if (router) {
        const { page, perPage } = router.match.query;
        if (page) {
            paramsClone.page = page;
        }

        if (perPage) {
            paramsClone.perPage = perPage;
        }

        ["sort", "where", "search"].forEach(key => {
            if (!router) {
                return;
            }

            if (typeof router.match.query[key] === "string") {
                try {
                    paramsClone[key] = JSON.parse(router.match.query[key]);
                } catch (e) {
                    // Do nothing.
                }
            }
        });
    }

    return paramsClone;
};
