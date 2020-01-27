import { Redux, MiddlewareFunction, Store, Action } from "@webiny/app-page-builder/types";
import { Middleware } from "redux";

export const wrapMiddleware = (
    middleware: MiddlewareFunction,
    actions?: Array<string>
): Middleware => {
    return (store: Store) => (next: Function) => (action: Action) => {
        if (!actions || actions.includes(action.type)) {
            middleware({ store, next, action });
        } else {
            next(action);
        }
    };
};

export default (redux: Redux): Middleware[] => {
    return redux.middleware.map(mw => {
        return wrapMiddleware(mw.middleware, mw.actions);
    });
};
