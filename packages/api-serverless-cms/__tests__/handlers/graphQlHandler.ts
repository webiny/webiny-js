import { createHandler } from "@webiny/handler-aws";
import { createInvoke } from "./helpers/invoke";
import { createLambdaContext } from "./helpers/lambdaContext";
import { Plugin } from "@webiny/plugins/types";
import { createCore } from "./helpers/core";
import { PathType } from "./types";
import { getIntrospectionQuery } from "graphql";
import { createGraphQl } from "./graphql";
import { createQueryFactory } from "~tests/handlers/helpers/factory";
import { createMutationFactory } from "~tests/handlers/helpers/factory/mutation";

export interface IGraphQlHandlerParams {
    path: PathType;
    plugins?: Plugin[];
    features?: boolean | string[];
}

export const useGraphQlHandler = (params: IGraphQlHandlerParams) => {
    const core = createCore({
        ...params
    });

    const handler = createHandler({
        plugins: core.plugins,
        debug: process.env.DEBUG === "true"
    });

    const invoke = createInvoke({
        handler,
        path: params.path,
        lambdaContext: createLambdaContext()
    });

    const createQuery = createQueryFactory({
        invoke
    });
    const createMutation = createMutationFactory({
        invoke
    });

    return {
        invoke,
        async introspect() {
            return invoke({
                body: {
                    query: getIntrospectionQuery()
                }
            });
        },
        handler,
        cmsStorage: core.cmsStorage,
        i18nStorage: core.i18nStorage,
        pageBuilderStorage: core.pageBuilderStorage,
        fileManagerStorage: core.fileManagerStorage,
        securityStorage: core.securityStorage,
        tenancyStorage: core.tenancyStorage,
        login: core.login,
        ...createGraphQl({
            createQuery,
            createMutation
        })
    };
};
