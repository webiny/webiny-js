import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import pageBuilderPlugins from "../../src/updateSettings";
import { createTenancyAndSecurity } from "../tenancySecurity";
import { getStorageOperations } from "../storageOperations";

interface Params {
    plugins?: any;
    storageOperationPlugins?: any[];
}
export default (params: Params = {}) => {
    const { plugins: extraPlugins = [] } = params;
    const ops = getStorageOperations({
        plugins: params.storageOperationPlugins || []
    });
    const handler = createHandler(
        ...ops.plugins,
        graphqlHandler(),
        ...createTenancyAndSecurity(),
        {
            type: "context",
            apply: context => {
                if (context.i18nContent) {
                    return;
                }
                context.i18nContent = {
                    getLocale: () => {
                        return {
                            code: "en-US"
                        };
                    }
                };
            }
        },
        pageBuilderPlugins({
            storageOperations: ops.storageOperations
        }),
        extraPlugins || []
    );

    return {
        handler
    };
};
