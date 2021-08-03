import React from "react";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";
import { Route, RouteProps } from "@webiny/react-router";
import { ReactComponent as WebinyLogo } from "../../images/webiny.svg";
import transparentBackground from "../../images/splash-transparent-bg.svg";

function Home(props: RouteProps) {
    return (
        <div className={"home"}>
                <img className={"transparent-bg"} src={transparentBackground} />
            <div className={"splash"}>
                <WebinyLogo className={"logo"} />
                <div className={"title"}>Welcome!</div>
                <div className={"description"}>
                    Everything you need to architect, build and deploy serverless applications.
                </div>

                <a
                    href="https://www.webiny.com/docs/webiny/introduction/"
                    className="get-started-button"
                    target="_blank"
                    rel={"noreferrer"}
                >
                    Get Started Tutorial
                </a>
            </div>
        </div>
    );
}

export default new RoutePlugin({
    route: <Route path="/" exact component={Home} />
});
