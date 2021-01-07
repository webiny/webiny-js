import React, { useEffect } from "react";
import { css } from "emotion";
// import { useCms } from "@webiny/app-headless-cms/admin/hooks";

const Playground = () => {
    // const { createApolloClient } = useCms();

    const tabs = [
        {
            name: "Main API",
            endpoint: process.env.REACT_APP_API_URL + "/graphql",
            headers: {},
            query: ""
        },
        {
            name: "CMS Manage API",
            endpoint: process.env.REACT_APP_API_URL + "/cms/manage/en-US",
            headers: {},
            query: ""
        },
        {
            name: "CMS Read API",
            endpoint: process.env.REACT_APP_API_URL + "/cms/read/en-US",
            headers: {},
            query: ""
        },
        {
            name: "CMS Preview API",
            endpoint: process.env.REACT_APP_API_URL + "/cms/preview/en-US",
            headers: {},
            query: ""
        }
    ];

    // const createApolloLink = session => {
    //     return {
    //         link: createApolloClient({ uri: session.endpoint }).link
    //     };
    // };

    useEffect(() => {
        // @ts-ignore
        window.GraphQLPlayground.init(document.getElementById("graphql-playground"), {
            tabs
            // createApolloLink
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
