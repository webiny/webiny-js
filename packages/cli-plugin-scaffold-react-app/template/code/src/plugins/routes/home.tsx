import React from "react";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";
import { Route } from "@webiny/react-router";
import { ReactComponent as WebinyLogo } from "../../images/webiny.svg";
import transparentBackground from "../../images/splash-transparent-bg.svg";
import Layout from "../../components/Layout";
import UsefulLink from "./home/UsefulLink";

function Home() {
    return (
        <Layout className={"home"}>
            <img alt={"Webiny"} className={"transparent-bg"} src={transparentBackground} />
            <div className={"splash"}>
                <a href={"https://www.webiny.com"} target="_blank" rel={"noreferrer"}>
                    <WebinyLogo className={"logo"} />
                </a>
                <h1>Welcome!</h1>
                <h2>Welcome to your new React application!</h2>
                <div>Here are some useful links for you:</div>
                <ul>
                    <UsefulLink url={"/docs/#"} title={"Create Custom Application Tutorial"}>
                        Learn how to create a completely custom application that&apos;s interacting with a standalone GraphQL API.
                    </UsefulLink>
                    <UsefulLink url={"/docs/#"} title={"The New React Application Scaffold"}>
                        Learn more about the New React Application scaffold that was used to create this React application.
                    </UsefulLink>
                    <UsefulLink
                        url={"/docs/how-to-guides/development/environment-variables"}
                        title={"Environment Variables"}
                    >
                        Learn what are environment variables and how you can assign them.
                    </UsefulLink>
                    <UsefulLink
                        url={"/docs/how-to-guides/deployment/deploy-your-project"}
                        title={"Deploy Your React Application"}
                    >
                        Learn how to deploy your Webiny project and its project applications, using the Webiny CLI.
                    </UsefulLink>
                    <UsefulLink
                        url={"/how-to-guides/webiny-cli/use-watch-command"}
                        title={"Use the Watch Command"}
                    >
                        Learn how to continuously rebuild and redeploy your code using the{" "}
                        <code>webiny watch</code> command.
                    </UsefulLink>
                    <UsefulLink
                        url={"/how-to-guides/deployment/connect-custom-domain"}
                        title={"Connect Custom Domain"}
                    >
                        Learn how to link an existing domain with your new React application.
                    </UsefulLink>
                </ul>
            </div>
        </Layout>
    );
}

export default new RoutePlugin({
    route: <Route path="/" exact component={Home} />
});
