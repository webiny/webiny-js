import React from "react";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";
import { Route } from "@webiny/react-router";

export default new RoutePlugin({
    route: <Route path="*" exact render={() => <div>4o4</div>} />
});
