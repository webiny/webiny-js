import { Route } from "@webiny/react-router";
import { PageRoute } from "@webiny/app-page-builder/site/components/Page";
import { RoutePlugin } from "@webiny/app/types";
import * as React from "react";

export default (): RoutePlugin => ({
    name: "pb-route",
    type: "route",
    route: <Route component={PageRoute} />
});
