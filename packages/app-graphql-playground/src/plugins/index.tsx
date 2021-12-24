import { GraphQLPlaygroundTabPlugin } from "~/types";
// @ts-ignore
import placeholder from "!!raw-loader!./placeholder.graphql";
import { config as appConfig } from "@webiny/app/config";

export default [
    {
        type: "graphql-playground-tab",
        tab() {
            const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);
            return {
                name: "Main API",
                endpoint: apiUrl + "/graphql",
                headers: {},
                query: placeholder
            };
        }
    } as GraphQLPlaygroundTabPlugin
];
