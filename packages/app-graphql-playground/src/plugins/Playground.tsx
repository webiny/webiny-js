import React, { useEffect, useRef } from "react";
import { css } from "emotion";
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
            console.log("Creating a link for ", endpoint);
            links.current[endpoint] = createApolloClient({ uri: endpoint }).link;
        } else {
            console.log("Using cached link");
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

    const playgroundContainer = css({
        marginTop: -3,
        " .playground": {
            height: "calc(100vh - 64px)"
        }
    });

    return <div id={"graphql-playground"} className={playgroundContainer} />;
};

export default Playground;
