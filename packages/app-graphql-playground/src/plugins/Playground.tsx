import React, { useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { plugins } from "@webiny/plugins";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { useSecurity } from "@webiny/app-security";

const Playground = ({ createApolloClient }) => {
    const { getCurrentLocale } = useI18N();
    const { identity } = useSecurity();
    const links = useRef({});

    const locale = getCurrentLocale("content");

    const tabs = plugins
        .byType("graphql-playground-tab")
        .map(pl => pl.tab({ locale, identity }))
        .filter(Boolean);

    const createApolloLink = ({ endpoint }) => {
        if (!links.current[endpoint]) {
            links.current[endpoint] = createApolloClient({ uri: endpoint }).link;
        }

        return {
            link: links.current[endpoint]
        };
    };

    useEffect(() => {
        // @ts-ignore
        window.GraphQLPlayground.init(document.getElementById("graphql-playground"), {
            tabs,
            createApolloLink
        });
    }, []);

    const PlaygroundContainer = styled("div")({
        marginTop: -3,
        overflow: "hidden",
        " .playground": {
            height: "calc(100vh - 64px)",
            margin: 0,
            padding: 0,
            fontFamily: "'Open Sans', sans-serif",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            color: "rgba(0,0,0,.8)",
            lineHeight: 1.5,
            letterSpacing: 0.53,
            marginRight: "-1px !important",
            "p, a, h1, h2, h3, h4, ul, pre, code": {
                margin: 0,
                padding: 0,
                color: "inherit"
            },
            "a:active, a:focus, button:focus, input:focus": {
                outline: "none"
            },
            "input, button, submit": {
                border: "none"
            },
            "input, button, pre": {
                fontFamily: "'Open Sans', sans-serif"
            },
            code: {
                fontFamily: "Consolas, monospace"
            }
        }
    });

    return <PlaygroundContainer id={"graphql-playground"} />;
};

export default Playground;
