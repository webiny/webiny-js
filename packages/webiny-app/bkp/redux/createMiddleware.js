// @flow
import type { Redux, MiddlewareFunction, Store, Action } from "webiny-app/types";

const wrapMiddleware = (types: Array<string>, middleware: MiddlewareFunction): Function => {
    return (store: Store) => (next: Function) => (action: Action) => {
        if (types.includes(action.type)) {
            middleware({ store, next, action });
        } else {
            next(action);
        }
    };
};

export default (redux: Redux): Array<Function> => {
    return redux.middleware.map(mw => {
        return wrapMiddleware(mw.actions, mw.middleware);
    });
};