import type { CreateHandlerCoreParams } from "./plugins";
import { defaultIdentity } from "./tenancySecurity";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { useGraphQLHandler as baseUseGraphQLHandler } from "@webiny/testing";
import { PluginsContainer } from "@webiny/plugins";
import {
    CANCEL_SCHEDULED_ACTION,
    type ICancelScheduledActionMutationResponse,
    type ICancelScheduledActionMutationVariables,
    type ICreateScheduledActionMutationVariables,
    type IListScheduledActionsQueryResponse,
    type IListScheduledActionsQueryVariables,
    type IScheduleActionMutationResponse,
    LIST_SCHEDULED_ACTION,
    SCHEDULE_ACTION
} from "./graphql.js";
import {createScheduler} from "~/createScheduler.js";
import type {SchedulerClientConfig} from "@webiny/aws-sdk/client-scheduler/index.js";

export const useGraphQLHandler = <C extends CmsContext>(params: CreateHandlerCoreParams) => {
    const plugins = new PluginsContainer(params.plugins || []);
    
    plugins.register(
        createScheduler({
            getClient: params.getScheduleClient,
        })
    );

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
        ...handler,
        createSchedule: handler.createMutation<
            ICreateScheduledActionMutationVariables,
            IScheduleActionMutationResponse
        >(SCHEDULE_ACTION),
        cancelScheduledAction: handler.createMutation<
            ICancelScheduledActionMutationVariables,
            ICancelScheduledActionMutationResponse
        >(CANCEL_SCHEDULED_ACTION),
        listScheduledActions: handler.createQuery<
            IListScheduledActionsQueryVariables,
            IListScheduledActionsQueryResponse
        >(LIST_SCHEDULED_ACTION)
    };
};
