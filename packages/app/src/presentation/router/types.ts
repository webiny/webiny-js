import type { Route } from "~/features/router/Route.js";

export type ReactRoute = {
    route: Route<any>;
    element: React.JSX.Element;
};
