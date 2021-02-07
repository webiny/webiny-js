import { GraphQLPlaygroundTabPlugin } from "@webiny/app-graphql-playground/types";
import raw from "raw.macro";
const manageQuery = raw("./placeholder.manage.graphql");
const readQuery = raw("./placeholder.read.graphql");
const previewQuery = raw("./placeholder.preview.graphql");

const plugins: GraphQLPlaygroundTabPlugin[] = [
    {
        type: "graphql-playground-tab",
        name: "graphql-playground-tab-manage",
        tab({ locale, identity }) {
            if (!identity.getPermission("cms.endpoint.manage")) {
                return null;
            }

            return {
                name: "Headless CMS - Manage API",
                endpoint: process.env.REACT_APP_API_URL + "/cms/manage/" + locale,
                headers: {},
                query: manageQuery
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
                name: "Headless CMS - Read API",
                endpoint: process.env.REACT_APP_API_URL + "/cms/read/" + locale,
                headers: {},
                query: readQuery
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
                name: "Headless CMS - Preview API",
                endpoint: process.env.REACT_APP_API_URL + "/cms/preview/" + locale,
                headers: {},
                query: previewQuery
            };
        }
    }
];

export default plugins;
