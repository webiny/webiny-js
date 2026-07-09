import type { GraphQLPlaygroundTabPlugin } from "~/types.js";
// @ts-expect-error
import placeholder from "!!raw-loader!./placeholder.graphql";
import { config as appConfig } from "@webiny/app/config.js";

const plugin: GraphQLPlaygroundTabPlugin = {
    type: "graphql-playground-tab",
    tab() {
        const apiUrl = appConfig.getKey("API_URL", process.env.WEBINY_ADMIN_API_URL) as string;
        return {
            name: "Main API",
            endpoint: apiUrl + "/graphql",
            headers: {},
            query: placeholder
        };
    }
};
export default [plugin];
