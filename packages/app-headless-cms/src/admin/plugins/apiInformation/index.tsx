import React from "react";
import { GraphQLPlaygroundTabPlugin } from "@webiny/app-graphql-playground/types";

const plugins: GraphQLPlaygroundTabPlugin[] = [
    {
        type: "graphql-playground-tab",
        name: "graphql-playground-tab-manage",
        tab({ locale, identity }) {
            if (!identity.getPermission("cms.endpoint.manage")) {
                return null;
            }

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
        tab({ locale, identity }) {
            if (!identity.getPermission("cms.endpoint.read")) {
                return null;
            }

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
        tab({ locale, identity }) {
            if (!identity.getPermission("cms.endpoint.preview")) {
                return null;
            }

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
