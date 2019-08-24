// @flow
import type { Redux, MiddlewareFunction, Store, Action } from "@webiny/app-page-builder/types";

export const wrapMiddleware = (
    middleware: MiddlewareFunction,
    actions: ?Array<string>
): Function => {
    return (store: Store) => (next: Function) => (action: Action) => {
        if (!actions || actions.includes(action.type)) {
            middleware({ store, next, action });
        } else {
            next(action);
        }
    };
};

export default (redux: Redux): Array<Function> => {
    return redux.middleware.map(mw => {
        return wrapMiddleware(mw.middleware, mw.actions);
    });
};
