// @flow
import type { WithFormParams } from "./types";

export default (withDataFormParams: WithFormParams, route: Object) => {
    const paramsClone = Object.assign({}, withDataFormParams);
    if (route) {
        let id = route.match.params.id || route.match.query.id;
        if (id) {
            paramsClone.id = id;
        }
    }

    return paramsClone;
};
