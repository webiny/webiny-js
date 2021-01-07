import React from "react";
import { GraphQLPlaygroundTabPlugin } from "@webiny/app-graphql-playground/types";

const plugins: GraphQLPlaygroundTabPlugin[] = [
    {
        type: "graphql-playground-tab",
        name: "graphql-playground-tab-manage",
        tab({ locale }) {
            return {
                name: "CMS Manage API",
                endpoint: process.env.REACT_APP_API_URL + "/cms/manage/" + locale,
                headers: {},
                query: "# Write your query and hit the Play button to see results"
            };
        }
    },
    {
        type: "graphql-playground-tab",
        name: "graphql-playground-tab-read",
        tab({ locale }) {
            return {
                name: "CMS Read API",
                endpoint: process.env.REACT_APP_API_URL + "/cms/read/" + locale,
                headers: {},
                query: "# Write your query and hit the Play button to see results"
            };
        }
    },
    {
        type: "graphql-playground-tab",
        name: "graphql-playground-tab-preview",
        tab({ locale }) {
            return {
                name: "CMS Preview API",
                endpoint: process.env.REACT_APP_API_URL + "/cms/preview/" + locale,
                headers: {},
                query: "# Write your query and hit the Play button to see results"
            };
        }
    }
];

export default plugins;
