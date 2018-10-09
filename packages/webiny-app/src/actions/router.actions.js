// @flow
import { createAction, addReducer } from "./../redux";

const PREFIX = "[ROUTER]";

export const ROUTER_ROUTE_CHANGED = `${PREFIX} Route changed`;

const routeChanged = createAction(ROUTER_ROUTE_CHANGED);

addReducer([ROUTER_ROUTE_CHANGED], "ui.route", (state, action) => {
    return action.payload;
});

export { routeChanged };
