import React from "react";
import { Provider } from "react-redux";
import { Playground as GQLPlayground, store } from "graphql-playground-react";
import styled from "@emotion/styled";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";

const Playground = () => {
    const { createApolloClient } = useCms();

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

    const Styled = styled("div")({
        ".playground": {
            height: "calc(100vh - 70px) !important",
            marginTop: -3
        }
    });

    const createApolloLink = session => {
        return {
            link: createApolloClient({ uri: session.endpoint }).link
        };
    };

    return (
        <Styled>
            <Provider store={store}>
                <GQLPlayground
                    tabs={tabs}
                    createApolloLink={createApolloLink}
                />
            </Provider>
        </Styled>
    );
};

export default Playground;
