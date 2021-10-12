import React from "react";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";
import { Route, Link, RouteChildrenProps } from "@webiny/react-router";
import { ReactComponent as WebinyLogo } from "~/images/webiny.svg";
import Layout from "~/components/Layout";

// A simple not-found page.
function NotFound(props: RouteChildrenProps) {
    return (
        <Layout className={"not-found"}>
            <a href={"https://www.webiny.com"} target="_blank" rel={"noreferrer"}>
                <WebinyLogo className={"logo"} />
            </a>
            <h1>Page not found</h1>
            <h2>
                Unfortunately, nothing was found at <code>{props.match.url}</code>.
            </h2>
            <Link to={"/"}> &larr; Back</Link>
        </Layout>
    );
}

// We register routes via the `RoutePlugin` plugin.
export default new RoutePlugin({
    route: <Route path="*" exact component={NotFound} />
});
