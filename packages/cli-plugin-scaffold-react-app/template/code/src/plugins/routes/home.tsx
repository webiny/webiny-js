import React from "react";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";
import { Route } from "@webiny/react-router";
import { ReactComponent as WebinyLogo } from "~/images/webiny.svg";
import Layout from "~/components/Layout";
import UsefulLink from "./home/UsefulLink";
import UsefulLinks from "./home/UsefulLinks";

// The home page.
function Home() {
    return (
        <Layout className={"home"}>
            <a href={"https://www.webiny.com"} target="_blank" rel={"noreferrer"}>
                <WebinyLogo className={"logo"} />
            </a>
            <h1>Welcome!</h1>
            <h2>Welcome to your new React application!</h2>
            <div>Here are some useful links for you &#8595;</div>
            <UsefulLinks>
                <UsefulLink
                    url={"/docs/tutorials/create-custom-application/introduction"}
                    title={"Create Custom Application Tutorial"}
                >
                    Learn how to create a completely custom application that&apos;s interacting with
                    a standalone GraphQL API.
                </UsefulLink>
                <UsefulLink
                    url={"/docs/how-to-guides/scaffolding/react-application"}
                    title={"React Application Scaffold"}
                >
                    Learn more about the React Application scaffold that was used to create this
                    React application.
                </UsefulLink>
                <UsefulLink
                    url={"/docs/how-to-guides/environment-variables"}
                    title={"Environment Variables"}
                >
                    Learn what are environment variables and how you can assign them.
                </UsefulLink>
                <UsefulLink
                    url={"/docs/how-to-guides/deployment/deploy-your-project"}
                    title={"Deploy Your React Application"}
                >
                    Learn how to deploy your Webiny project and its project applications, using the
                    Webiny CLI.
                </UsefulLink>
                <UsefulLink
                    url={"/docs/how-to-guides/use-watch-command"}
                    title={"Use the Watch Command"}
                >
                    Learn how to continuously rebuild and redeploy your code using the{" "}
                    <code>webiny watch</code> command.
                </UsefulLink>
                <UsefulLink
                    url={"/docs/how-to-guides/deployment/connect-custom-domain"}
                    title={"Connect Custom Domain"}
                >
                    Learn how to link an existing domain with your new React application.
                </UsefulLink>
            </UsefulLinks>
        </Layout>
    );
}

// We register routes via the `RoutePlugin` plugin.
export default new RoutePlugin({
    route: <Route path="/" exact component={Home} />
});
