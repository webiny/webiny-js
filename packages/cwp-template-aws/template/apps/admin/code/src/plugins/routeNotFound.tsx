import React from "react";
import { Route, Redirect } from "@webiny/react-router";

/**
 * When react-router is unable to find a proper route, redirect to "/".
 */
export default {
    type: "route",
    name: "route-not-found",
    route: <Route path="*" render={() => <Redirect to={"/"} />} />
};
