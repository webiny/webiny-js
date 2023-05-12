/**
 * This logic/file should be moved somewhere else as it is relying on AWS specific stuff.
 */
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
import { createRawEventHandler } from "@webiny/handler-aws";

export enum InvocationTypes {
    SCHEDULED = "scheduled"
}

export interface HandlerArgs {
    datetime: string;
    tenant: string;
    locale: string;
    invocationType?: InvocationTypes;
    futureDatetime?: string;
}

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
const createScheduleActionLambda = (params: Configuration) => {
    const { cwClient: cloudWatchEventClient, storageOperations, handlers } = params;

    return createRawEventHandler<HandlerArgs>(
        async ({ payload, context, lambdaContext: eventContext }) => {
            try {
                const { locale, tenant, invocationType } = payload;
                /**
                 * If invocationType is "scheduled", execute the action.
                 */
                if (invocationType === InvocationTypes.SCHEDULED) {
                    await executeTask({
                        args: payload,
                        lambdaName: handlers.executeAction,
                        handlerClient: context.handlerClient,
                        storageOperations
                    });
                }

                /**
                 * Get current scheduled task from the DB.
                 */
                const currentTask = await storageOperations.getCurrentTask({
                    where: {
                        tenant,
                        locale
                    }
                });

                /**
                 * Get next task from the DB.
                 */
                const [[nextItem]] = await storageOperations.list({
                    where: {
                        tenant,
                        locale
                    },
                    sort: ["datetime_ASC"],
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
                        invocationType,
                        datetime: currentTaskDatetime
                    })
                ) {
                    await restoreDateTime({
                        tenant,
                        locale,
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
                    tenant,
                    locale
                });
                /**
                 * Update current task.
                 */
                await storageOperations.updateCurrentTask({ item: nextItem });
            } catch (ex) {
                console.error(
                    "[HANDLER_CREATE_RULE] => ",
                    JSON.stringify({
                        message: ex.message,
                        code: ex.code,
                        data: ex.data
                    })
                );
                // TODO: Handler error. Maybe save it into DB.
            }
        }
    );
};

export const scheduleActionHandlerPlugins = (config: Configuration) => [
    basePlugins(),
    createScheduleActionLambda(config)
];
