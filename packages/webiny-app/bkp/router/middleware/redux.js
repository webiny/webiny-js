// @flow
import { dispatch } from "webiny-app/redux";
import { routeChanged } from "webiny-app/actions";

export default () => {
    return async (params: Object, next: Function) => {
        const { route, match } = params;
        dispatch(routeChanged({ route, match }));
        next();
    };
};
