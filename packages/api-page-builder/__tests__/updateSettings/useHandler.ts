import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import pageBuilderPlugins from "../../src/updateSettings";

interface Params {
    plugins?: any;
}
export default (params: Params = {}) => {
    const { plugins: extraPlugins = [] } = params;
    // @ts-ignore
    if (typeof __getStorageOperationsPlugins !== "function") {
        throw new Error(`There is no global "__getStorageOperationsPlugins" function.`);
    }
    // @ts-ignore
    const storageOperations = __getStorageOperationsPlugins();
    if (typeof storageOperations !== "function") {
        throw new Error(
            `A product of "__getStorageOperationsPlugins" must be a function to initialize storage operations.`
        );
    }
    const handler = createHandler(
        storageOperations(),
        graphqlHandler(),
        {
            type: "context",
            apply: context => {
                if (context.tenancy) {
                    return;
                }
                context.tenancy = {
                    getCurrentTenant: () => {
                        return {
                            id: "root"
                        };
                    }
                };
            }
        },
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
        pageBuilderPlugins(),
        extraPlugins || []
    );

    return {
        handler
    };
};
