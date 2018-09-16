// @flow
import { createAction } from "./../redux";

const PREFIX = "[ROUTER]";

export const ROUTER_ROUTE_CHANGED = `${PREFIX} Route changed`;

const routeChanged = createAction(ROUTER_ROUTE_CHANGED, {
    slice: "ui.route",
    reducer: ({ action }) => {
        return action.payload;
    }
});

export { routeChanged };
