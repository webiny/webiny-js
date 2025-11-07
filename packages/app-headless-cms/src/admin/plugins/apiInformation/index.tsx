import type { GraphQLPlaygroundTabPlugin } from "@webiny/app-graphql-playground/types.js";
import raw from "raw.macro";
const manageQuery = raw("./placeholder.manage.graphql");
const readQuery = raw("./placeholder.read.graphql");
const previewQuery = raw("./placeholder.preview.graphql");
import { config as appConfig } from "@webiny/app/config.js";

const plugins: GraphQLPlaygroundTabPlugin[] = [
    {
        type: "graphql-playground-tab",
        name: "graphql-playground-tab-manage",
        tab({ identity }) {
            const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);
            if (
                !identity ||
                !identity.getPermission ||
                !identity.getPermission("cms.endpoint.manage")
            ) {
                return null;
            }

            return {
                name: "Headless CMS - Manage API",
                endpoint: apiUrl + "/cms/manage",
                headers: {},
                query: manageQuery
            };
        }
    },
    {
        type: "graphql-playground-tab",
        name: "graphql-playground-tab-read",
        tab({ identity }) {
            const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);
            if (
                !identity ||
                !identity.getPermission ||
                !identity.getPermission("cms.endpoint.read")
            ) {
                return null;
            }

            return {
                name: "Headless CMS - Read API",
                endpoint: apiUrl + "/cms/read",
                headers: {},
                query: readQuery
            };
        }
    },
    {
        type: "graphql-playground-tab",
        name: "graphql-playground-tab-preview",
        tab({ identity }) {
            const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);
            if (
                !identity ||
                !identity.getPermission ||
                !identity.getPermission("cms.endpoint.preview")
            ) {
                return null;
            }

            return {
                name: "Headless CMS - Preview API",
                endpoint: apiUrl + "/cms/preview",
                headers: {},
                query: previewQuery
            };
        }
    }
];

export default plugins;
