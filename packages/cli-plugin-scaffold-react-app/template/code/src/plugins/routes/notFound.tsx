import React from "react";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";
import { Route, RouteChildrenProps } from "@webiny/react-router";
import { ReactComponent as WebinyLogo } from "../../images/webiny.svg";
import transparentBackground from "../../images/splash-transparent-bg.svg";
import Layout from "../../components/Layout";

function NotFound(props: RouteChildrenProps) {
    return (
        <Layout className={"not-found"}>
            <img alt={"Webiny"} className={"transparent-bg"} src={transparentBackground} />
            <div className={"splash"}>
                <a href={"https://www.webiny.com"} target="_blank" rel={"noreferrer"}>
                    <WebinyLogo className={"logo"} />
                </a>
                <h1>Page not found</h1>
                <h2>
                    Unfortunately, nothing was found at <code>{props.match.url}</code>.
                </h2>
                <div>
                    <a href={"/"}>Click here to go back.</a>
                </div>
            </div>
        </Layout>
    );
}

export default new RoutePlugin({
    route: <Route path="*" exact component={NotFound} />
});
