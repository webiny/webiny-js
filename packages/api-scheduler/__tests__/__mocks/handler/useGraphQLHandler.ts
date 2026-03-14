import type { CreateHandlerCoreParams } from "./plugins";
import { defaultIdentity } from "./tenancySecurity";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { useGraphQLHandler as baseUseGraphQLHandler } from "@webiny/testing";
import { PluginsContainer } from "@webiny/plugins";
import {
    CREATE_SCHEDULED_ACTION,
    type ICreateScheduledActionMutationResponse,
    type ICreateScheduledActionMutationVariables
} from "./graphql.js";

export const useGraphQLHandler = <C extends CmsContext>(params: CreateHandlerCoreParams) => {
    const plugins = new PluginsContainer(params.plugins || []);

    const handler = baseUseGraphQLHandler({
        permissions: [
            {
                name: "*"
            }
        ],
        ...params,
        debug: process.env.DEBUG === "true",
        plugins: plugins.all()
    });

    return {
        plugins,
        identity: params.identity || defaultIdentity,
        handler,
        createSchedule: handler.createMutation<
            ICreateScheduledActionMutationVariables,
            ICreateScheduledActionMutationResponse
        >(CREATE_SCHEDULED_ACTION)
    };
};
