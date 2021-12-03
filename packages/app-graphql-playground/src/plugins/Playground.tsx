import React, { Fragment, useEffect, useRef, useCallback, useState } from "react";
import { ApolloLink } from "apollo-link";
import { setContext } from "apollo-link-context";
import loadScript from "load-script";
import { Global } from "@emotion/core";
import { plugins } from "@webiny/plugins";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { useSecurity } from "@webiny/app-security";
import { CircularProgress } from "@webiny/ui/Progress";
import { playgroundDialog, PlaygroundContainer } from "./Playground.styles";
import { settings } from "./settings";
import { config as appConfig } from "@webiny/app/config";

const withHeaders = (link, headers) => {
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
        // @ts-ignore
        if (window.GraphQLPlayground) {
            return resolve();
        }

        return loadScript(
            "https://cdn.jsdelivr.net/npm/@apollographql/graphql-playground-react@1.7.32/build/static/js/middleware.js",
            resolve
        );
    });
};

const Playground = ({ createApolloClient }) => {
    const [loading, setLoading] = useState(true);
    const { getCurrentLocale } = useI18N();
    const { identity } = useSecurity();
    const links = useRef({});

    const locale = getCurrentLocale("content");

    const tabs = plugins
        .byType("graphql-playground-tab")
        .map(pl => pl.tab({ locale, identity }))
        .filter(Boolean);

    const createApolloLink = useCallback(({ endpoint, headers }) => {
        // If the request endpoint is not know to us, return the first available
        const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);
        if (!endpoint.includes(apiUrl)) {
            return { link: withHeaders(Object.values(links.current)[0], headers) };
        }

        if (!links.current[endpoint]) {
            links.current[endpoint] = createApolloClient({ uri: endpoint }).link;
        }

        return {
            link: withHeaders(links.current[endpoint], headers)
        };
    }, []);

    useEffect(() => {
        initScripts().then(() => {
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!loading) {
            // @ts-ignore
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
