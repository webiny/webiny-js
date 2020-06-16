import React from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { Alert } from "@webiny/ui/Alert";
import { Elevation } from "@webiny/ui/Elevation";
import { css } from "emotion";
import styled from "@emotion/styled";

const GET_ERROR = gql`
    {
        networkError
    }
`;

const errorStyle = css({
    margin: 50,
    padding: "15px 25px 5px 25px",
    boxSizing: "border-box"
});

const Code = styled("span")({
    padding: "2px 5px",
    margin: "0 2px",
    borderRadius: "5px",
    color: "var(--webiny-theme-color-on-primary)",
    backgroundColor: "var(--webiny-theme-color-primary)"
});

const Paragraph = styled("span")({
    lineHeight: 1.8
});

const NetworkError = ({ children }) => {
    const { data } = useQuery(GET_ERROR, { fetchPolicy: "cache-only" });

    if (!process.env.REACT_APP_GRAPHQL_API_URL && process.env.NODE_ENV === "production") {
        return (
            <Elevation className={errorStyle} z={2}>
                <Alert type={"danger"} title={"GraphQL API is unavailable"}>
                    <Paragraph>
                        Looks like you&#39;ve deployed your apps before deploying an API for them.
                        <br />
                        Make sure you deploy a matching API environment before deploying your apps
                        by running
                        <Code>yarn webiny deploy api --env=your-env</Code>. This is necessary for
                        your apps to be built correctly.
                        <br />
                        Once your API is deployed, deploy your apps by running
                        <Code>yarn webiny deploy apps --env=your-env</Code>.
                    </Paragraph>
                    <br />
                    <Paragraph>
                        For step by step instructions on deploying your apps, visit our{" "}
                        <a
                            target={"_blank"}
                            rel={"noreferrer"}
                            href={"https://docs.webiny.com/docs/get-started/going-live"}
                        >
                            Going Live guide
                        </a>
                        .
                    </Paragraph>
                </Alert>
            </Elevation>
        );
    }

    if (!process.env.REACT_APP_GRAPHQL_API_URL && process.env.NODE_ENV === "development") {
        return (
            <Elevation className={errorStyle} z={2}>
                <Alert type={"danger"} title={"GraphQL API is unavailable"}>
                    <Paragraph>
                        Looks like you&#39;ve started your app before deploying an API for it.
                        <br />
                        Make sure you deploy a <Code>local</Code> environment of your API by running
                        <Code>yarn webiny deploy api --env=local</Code>. This is necessary to run
                        local React apps.
                        <br />
                        Once your API is deployed, restart this app via your terminal by running{" "}
                        <Code>yarn start</Code> again.
                    </Paragraph>
                    <br />
                    <Paragraph>
                        For step by step instructions on getting started with Webiny, visit our{" "}
                        <a
                            target={"_blank"}
                            rel={"noreferrer"}
                            href={"https://docs.webiny.com/docs/get-started/quick-start"}
                        >
                            Quick Start guide
                        </a>
                        .
                    </Paragraph>
                </Alert>
            </Elevation>
        );
    }

    return data && data.networkError ? (
        <Elevation className={errorStyle} z={2}>
            <Alert type={"danger"} title={"GraphQL API is unavailable"}>
                <Paragraph>
                    Your API seems to be unavailable!
                    <br />
                    Make sure your API is working by visiting{" "}
                    <a
                        href={process.env.REACT_APP_GRAPHQL_API_URL}
                        target={"_blank"}
                        rel={"noreferrer"}
                    >
                        {process.env.REACT_APP_GRAPHQL_API_URL}
                    </a>
                    .
                    <br />
                    If you&#39;ve recently deployed your API, please allow <Code>
                        ~10 minutes
                    </Code>{" "}
                    for your API URL to become available.
                </Paragraph>
            </Alert>
        </Elevation>
    ) : (
        children
    );
};

export { NetworkError, GET_ERROR };
