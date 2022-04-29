import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import pageBuilderPlugins from "../../src/updateSettings";
import { createTenancyAndSecurity } from "../tenancySecurity";
import { getStorageOperations } from "../storageOperations";
import { ContextPlugin } from "@webiny/handler";
import { PbContext } from "~/graphql/types";

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
        new ContextPlugin<PbContext>(async context => {
            if (context.i18n) {
                return;
            }
            context.i18n = {
                // @ts-ignore
                ...(context.i18n || {}),
                getLocale: () => {
                    return {
                        code: "en-US"
                    };
                }
            };
        }),
        pageBuilderPlugins({
            storageOperations: ops.storageOperations
        }),
        extraPlugins || []
    );

    return {
        handler
    };
};
