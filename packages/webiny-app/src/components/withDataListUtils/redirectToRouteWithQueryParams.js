// @flow
import typeof { router as Router } from "webiny-app/router";

export default (params: Object, router: Router) => {
    const paramsClone = Object.assign({}, params);

    ["sort", "search", "where"].forEach(key => {
        if (typeof paramsClone[key] === "object") {
            paramsClone[key] = JSON.stringify(paramsClone[key]);
        }
    });

    const { perPage, page, where, search, sort } = paramsClone;

    router.goToRoute({
        merge: true,
        params: {
            perPage,
            page,
            where,
            search,
            sort
        }
    });
};
