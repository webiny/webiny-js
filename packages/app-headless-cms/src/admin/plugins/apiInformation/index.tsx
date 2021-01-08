import { GraphQLPlaygroundTabPlugin } from "@webiny/app-graphql-playground/types";
// @ts-ignore
import manageQuery from "!!raw-loader!./placeholder.manage.graphql";
// @ts-ignore
import readQuery from "!!raw-loader!./placeholder.read.graphql";
// @ts-ignore
import previewQuery from "!!raw-loader!./placeholder.preview.graphql";

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
