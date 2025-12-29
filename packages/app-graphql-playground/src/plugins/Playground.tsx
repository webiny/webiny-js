import React, { Fragment, useEffect, useRef, useCallback, useState } from "react";
import { ApolloLink } from "apollo-link";
import { setContext } from "apollo-link-context";
/**
 * Package load-script does not have types.
 */
// @ts-expect-error
import loadScript from "load-script";
import { Global } from "@emotion/react";
import { plugins } from "@webiny/plugins";
import { useIdentity } from "@webiny/app-admin";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import { CircularProgress } from "@webiny/ui/Progress/index.js";
import { playgroundDialog, PlaygroundContainer } from "./Playground.styles.js";
import { settings } from "./settings.js";
import { config as appConfig } from "@webiny/app/config.js";
import type ApolloClient from "apollo-client";
import type { GraphQLPlaygroundTabPlugin } from "~/types.js";
import { ORIGINAL_GQL_PLAYGROUND_URL, PATCHED_GQL_PLAYGROUND_URL } from "./constants.js";

const withHeaders = (link: ApolloLink, headers: Record<string, string>): ApolloLink => {
    return ApolloLink.from([
        setContext(async (_, req) => {
            return {
                headers: {
                    ...req.headers,
                    ...headers
                }
            };
        }),
        link
    ]);
};

const initScripts = () => {
    return new Promise((resolve: any) => {
        // @ts-expect-error
        if (window.GraphQLPlayground) {
            return resolve();
        }

        loadScript(PATCHED_GQL_PLAYGROUND_URL, (err: Error) => {
            if (err) {
                return loadScript(ORIGINAL_GQL_PLAYGROUND_URL, resolve);
            }

            resolve();
        });
    });
};

interface CreateApolloClientParams {
    uri: string;
}

interface PlaygroundProps {
    createApolloClient: (params: CreateApolloClientParams) => ApolloClient<any>;
}

interface CreateApolloLinkCallableParams {
    endpoint: string;
    headers: Record<string, string>;
}

interface CreateApolloLinkCallableResult {
    link: ApolloLink;
}

interface CreateApolloLinkCallable {
    (params: CreateApolloLinkCallableParams): CreateApolloLinkCallableResult;
}

const Playground = ({ createApolloClient }: PlaygroundProps) => {
    const [loading, setLoading] = useState(true);
    const { identity } = useIdentity();
    const links = useRef<Record<string, ApolloLink>>({});

    const tabs = plugins
        .byType<GraphQLPlaygroundTabPlugin>("graphql-playground-tab")
        .map(pl =>
            pl.tab({
                identity: identity as Identity
            })
        )
        .filter(Boolean);

    const createApolloLink = useCallback<CreateApolloLinkCallable>(({ endpoint, headers }) => {
        const current = links.current;
        // If the request endpoint is not know to us, return the first available
        const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL) as string;
        if (!endpoint.includes(apiUrl)) {
            return { link: withHeaders(Object.values(current)[0], headers) };
        }

        if (!current[endpoint]) {
            current[endpoint] = createApolloClient({ uri: endpoint }).link;
        }

        return {
            link: withHeaders(current[endpoint], headers)
        };
    }, []);

    useEffect(() => {
        initScripts().then(() => {
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!loading) {
            // @ts-expect-error
            window.GraphQLPlayground.init(document.getElementById("graphql-playground"), {
                tabs,
                createApolloLink,
                settings
            });
        }
    }, [loading]);

    return (
        <Fragment>
            {loading ? (
                <CircularProgress label={"Loading playground..."} />
            ) : (
                <PlaygroundContainer id={"graphql-playground"} />
            )}
            <Global styles={playgroundDialog} />
        </Fragment>
    );
};

export default Playground;
