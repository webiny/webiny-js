import type { CreateHandlerCoreParams } from "./plugins";
import { useGraphQLHandler as baseUseGraphQLHandler } from "@webiny/testing";
import { PluginsContainer } from "@webiny/plugins";
import {
    CANCEL_SCHEDULED_ACTION,
    GET_SCHEDULED_ACTION,
    type ICancelScheduledActionMutationResponse,
    type ICancelScheduledActionMutationVariables,
    type ICreateScheduledActionMutationVariables,
    IGetScheduledActionQueryResponse,
    IGetScheduledActionQueryVariables,
    type IListScheduledActionsQueryResponse,
    type IListScheduledActionsQueryVariables,
    type IScheduleActionMutationResponse,
    LIST_SCHEDULED_ACTION,
    SCHEDULE_ACTION
} from "./graphql.js";
import { createScheduler } from "~/createScheduler.js";

export const useGraphQLHandler = (params: CreateHandlerCoreParams) => {
    const plugins = new PluginsContainer(params.plugins || []);

    plugins.register(
        createScheduler({
            getClient: params.getScheduleClient
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
        getScheduledAction: handler.createQuery<
            IGetScheduledActionQueryVariables,
            IGetScheduledActionQueryResponse
        >(GET_SCHEDULED_ACTION),
        listScheduledActions: handler.createQuery<
            IListScheduledActionsQueryVariables,
            IListScheduledActionsQueryResponse
        >(LIST_SCHEDULED_ACTION)
    };
};
