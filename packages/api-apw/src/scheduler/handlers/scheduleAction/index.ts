import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { ClientContext } from "@webiny/handler-client/types";
import { ApwScheduleActionStorageOperations } from "~/scheduler/types";
import {
    isDateTimeInNextCentury,
    moveDateTimeToNextCentury,
    shouldRestoreDatetime,
    basePlugins
} from "~/scheduler/handlers/utils";
import {
    executeTask,
    shouldScheduleTask,
    restoreDateTime,
    scheduleLambdaExecution
} from "./scheduleAction.utils";

export enum InvocationTypes {
    SCHEDULED = "scheduled"
}

export type HandlerArgs = {
    datetime: string;
    tenant: string;
    locale: string;
    invocationType?: InvocationTypes;
    futureDatetime?: string;
};

export interface Configuration {
    cwClient: any;
    storageOperations: ApwScheduleActionStorageOperations;
    handlers: {
        executeAction: string;
    };
}

const log = console.log;

/**
 * Handler that creates a cloudwatch event rule for the schedule action workflow.
 */
const scheduleActionLambda = ({
    cwClient: cloudWatchEventClient,
    storageOperations,
    handlers
}: Configuration): HandlerPlugin<ArgsContext<HandlerArgs>, ClientContext> => ({
    type: "handler",
    async handle(context): Promise<void> {
        try {
            const { invocationArgs: args, handlerClient, args: originalArgs } = context;

            const [, eventContext] = originalArgs;

            /**
             * If invocationType is "scheduled", execute the action.
             */
            if (args.invocationType === InvocationTypes.SCHEDULED) {
                await executeTask({
                    args,
                    lambdaName: handlers.executeAction,
                    handlerClient,
                    storageOperations
                });
            }

            /**
             * Get current scheduled task from the DB.
             */
            const currentTask = await storageOperations.getCurrentTask({
                where: {
                    tenant: args.tenant,
                    locale: args.locale
                }
            });

            /**
             * Get next task from the DB.
             */
            const [[nextItem]] = await storageOperations.list({
                where: {
                    tenant: args.tenant,
                    locale: args.locale
                },
                sort: "datetime_ASC",
                limit: 1
            });

            if (!nextItem) {
                log(`No item found.`);
                return;
            }

            const nextTaskDatetime = nextItem.data.datetime;
            const currentTaskDatetime = currentTask && currentTask.data.datetime;

            if (isDateTimeInNextCentury(nextTaskDatetime)) {
                log(`Already processed the task.`);
                return;
            }

            if (!shouldScheduleTask(nextTaskDatetime, currentTaskDatetime)) {
                log(`Already scheduled the task.`);
                return;
            }

            const futureDatetime = moveDateTimeToNextCentury(nextItem.data.datetime);
            /**
             * Update "datetime" to a future date to mark it as scheduled.
             */
            log(`Update task's datetime to `, futureDatetime);
            await storageOperations.update({
                item: {
                    ...nextItem,
                    data: { ...nextItem.data, datetime: futureDatetime }
                },
                input: { ...nextItem.data, datetime: futureDatetime }
            });
            /**
             * Restore "datetime" of current task so that it can be schedule in next cycle.
             */
            if (
                currentTaskDatetime &&
                shouldRestoreDatetime({
                    invocationType: args.invocationType,
                    datetime: currentTaskDatetime
                })
            ) {
                await restoreDateTime({
                    tenant: args.tenant,
                    locale: args.locale,
                    task: currentTask,
                    storageOperations
                });
            }
            /**
             * Schedule Lambda
             */
            log(`Schedule Lambda Execution...`);
            await scheduleLambdaExecution({
                cloudWatchEventClient,
                invokedFunctionArn: eventContext.invokedFunctionArn,
                datetime: nextItem.data.datetime,
                futureDatetime: futureDatetime,
                tenant: args.tenant,
                locale: args.locale
            });
            /**
             * Update current task.
             */
            await storageOperations.updateCurrentTask({ item: nextItem });
        } catch (e) {
            log("[HANDLER_CREATE_RULE] Error => ", e);
            // TODO: Handler error. Maybe save it into DB.
        }
    }
});

export const scheduleActionHandlerPlugins = (config: Configuration) => [
    basePlugins(),
    scheduleActionLambda(config)
];
