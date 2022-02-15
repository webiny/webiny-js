import { GraphQLPlaygroundTabPlugin } from "~/types";
// @ts-ignore
import placeholder from "!!raw-loader!./placeholder.graphql";
import { config as appConfig } from "@webiny/app/config";

const plugin: GraphQLPlaygroundTabPlugin = {
    type: "graphql-playground-tab",
    tab() {
        const apiUrl: string = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);
        return {
            name: "Main API",
            endpoint: apiUrl + "/graphql",
            headers: {},
            query: placeholder
        };
    }
};
export default [plugin];
