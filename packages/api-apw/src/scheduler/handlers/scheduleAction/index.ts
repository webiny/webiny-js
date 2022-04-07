import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { ApwScheduleAction, ApwScheduleActionStorageOperations } from "~/scheduler/types";
import {
    DeleteRuleCommand,
    RemoveTargetsCommand,
    PutTargetsCommand,
    PutRuleCommand
} from "@aws-sdk/client-cloudwatch-events";
import {
    dateTimeToCronExpression,
    isDateTimeInNextCentury,
    moveDateTimeToCurrentCentury,
    moveDateTimeToNextCentury,
    shouldRestoreDatetime
} from "../utils";
import { ClientContext } from "@webiny/handler-client/types";

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

interface Configuration {
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
export default ({
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

interface ScheduleLambdaExecutionParams extends Omit<HandlerArgs, "invocationType"> {
    cloudWatchEventClient: any;
    invokedFunctionArn: string;
}

/**
 * Here we're using the hardcoded values for editing cloudwatch event rule.
 * To use dynamic value of these resources we need to somehow get these values from pulumi state file.
 * Maybe by saving them as APW settings in DB using CLI's "after-deploy-hook".
 */
const RULE_NAME = "apw-scheduler-event-rule";
const TARGET_ID = "apw-scheduler-event-rule-target-id";

async function scheduleLambdaExecution({
    cloudWatchEventClient,
    invokedFunctionArn,
    datetime,
    futureDatetime,
    tenant,
    locale
}: ScheduleLambdaExecutionParams) {
    /**
     * Remove the target
     */
    const removeTargetsCommand = new RemoveTargetsCommand({
        Rule: RULE_NAME,
        Ids: [TARGET_ID]
    });
    const removeTargetsResponse = await cloudWatchEventClient.send(removeTargetsCommand);
    /**
     * Log error.
     */
    if (
        typeof removeTargetsResponse.FailedEntryCount === "number" &&
        removeTargetsResponse.FailedEntryCount !== 0
    ) {
        console.info("Failed in removing the targets!");
        console.info(removeTargetsResponse.FailedEntries);
    }
    /**
     * Delete the Rule
     */
    const deleteRuleCommand = new DeleteRuleCommand({
        Name: RULE_NAME
    });
    await cloudWatchEventClient.send(deleteRuleCommand);

    /**
     * Create a new one.
     * Min  H   D   M   DW  Y
     * 20   10  10  03  *   2022
     */
    const cronExpression = dateTimeToCronExpression(datetime);

    const ruleParams = {
        Name: RULE_NAME,
        ScheduleExpression: `cron(${cronExpression})`,
        State: "ENABLED"
    };

    await cloudWatchEventClient.send(new PutRuleCommand(ruleParams));
    /**
     * Add lambda as target for the rule.
     */
    await cloudWatchEventClient.send(
        new PutTargetsCommand({
            Rule: RULE_NAME,
            Targets: [
                {
                    Arn: invokedFunctionArn,
                    Id: TARGET_ID,
                    Input: JSON.stringify({
                        datetime: datetime,
                        tenant: tenant,
                        locale: locale,
                        invocationType: InvocationTypes.SCHEDULED,
                        futureDatetime: futureDatetime
                    } as HandlerArgs)
                }
            ]
        })
    );
}

const shouldScheduleTask = (
    nextTaskDatetime: string,
    currentTaskDatetime: string | null
): boolean => {
    return !currentTaskDatetime || nextTaskDatetime < currentTaskDatetime;
};

interface RestoreDateTimeParams
    extends Pick<Configuration, "storageOperations">,
        Pick<HandlerArgs, "tenant" | "locale"> {
    task: ApwScheduleAction;
}

const restoreDateTime = async ({
    locale,
    tenant,
    task: currentTask,
    storageOperations
}: RestoreDateTimeParams): Promise<void> => {
    log(`Mark task "${currentTask.id}" as undone by restoring original "datetime".`);
    const item = await storageOperations.get({
        where: {
            tenant,
            locale,
            id: currentTask.id
        }
    });
    if (item) {
        const newDateTime = moveDateTimeToCurrentCentury(item.data.datetime);
        await storageOperations.update({
            item: {
                ...item,
                data: { ...item.data, datetime: newDateTime }
            },
            input: { ...item.data, datetime: newDateTime }
        });
    }
};

interface ExecuteTaskParams {
    args: HandlerArgs;
    handlerClient: ClientContext["handlerClient"];
    lambdaName: string;
    storageOperations: Configuration["storageOperations"];
}

const executeTask = async ({
    args,
    lambdaName,
    handlerClient,
    storageOperations
}: ExecuteTaskParams): Promise<void> => {
    log(`Executing task at: `, new Date().toISOString());

    if (typeof handlerClient.invoke === "function") {
        await handlerClient.invoke({
            name: lambdaName,
            payload: {
                futureDatetime: args.futureDatetime,
                datetime: args.datetime,
                tenant: args.tenant,
                locale: args.locale
            },
            await: false
        });
    }

    /**
     * Delete current schedule Task. So that, we can schedule a new one later.
     */
    try {
        await storageOperations.deleteCurrentTask({
            tenant: args.tenant,
            locale: args.locale
        });
    } catch (e) {
        console.error(e);
    }
};
