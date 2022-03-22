import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { ApwScheduleActionStorageOperations } from "~/scheduler/types";
import {
    DeleteRuleCommand,
    RemoveTargetsCommand,
    PutTargetsCommand,
    PutRuleCommand
} from "@aws-sdk/client-cloudwatch-events";
import { dateTimeToCronExpression, updateYear } from "../utils";
import { ClientContext } from "@webiny/handler-client/types";

export enum InvocationTypes {
    SCHEDULED = "scheduled"
}

export type HandlerArgs = {
    datetime: string;
    tenant: string;
    locale: string;
    invocationType?: InvocationTypes;
    futureDateTime?: string;
};

interface Configuration {
    cwClient: any;
    storageOperations: ApwScheduleActionStorageOperations;
    handlers: {
        executeAction: string;
    };
}

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
        const log = console.log;

        try {
            log("RUNNING ScheduleAction CreateRule Handler");
            const { invocationArgs: args, handlerClient, args: originalArgs } = context;
            console.log("args ", args);
            const [, eventContext] = originalArgs;

            /**
             * If invocationType in args is "scheduled", execute the action.
             */
            if (args.invocationType === InvocationTypes.SCHEDULED) {
                log(`Executing task at: `, new Date().toISOString());

                if (typeof handlerClient.invoke === "function") {
                    await handlerClient.invoke({
                        name: handlers.executeAction,
                        payload: {
                            futureDateTime: args.futureDateTime,
                            datetime: args.datetime,
                            tenant: args.tenant,
                            locale: args.locale
                        },
                        await: false
                    });
                }

                /**
                 * Delete current schedule Task.
                 */
                try {
                    await storageOperations.deleteCurrentTask({
                        tenant: args.tenant,
                        locale: args.locale
                    });
                } catch (e) {
                    console.error(e);
                }
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
            }

            /**
             * Same year.
             */
            if (
                performCheck({
                    invocationType: args.invocationType,
                    nextDateTime: nextItem.data.datetime,
                    currentDateTime: currentTask && currentTask.data.datetime
                })
            ) {
                const futureDateTime = updateYear(nextItem.data.datetime, value => value + 100);
                /**
                 * Update GSI1_SK
                 */
                console.log(`Updating record's datetime to `, futureDateTime);
                await storageOperations.update({
                    item: {
                        ...nextItem,
                        data: { ...nextItem.data, datetime: futureDateTime }
                    },
                    input: { ...nextItem.data, datetime: futureDateTime }
                });
                /**
                 * Mark current scheduled task as undone.
                 */
                if (
                    args.invocationType !== "scheduled" &&
                    currentTask &&
                    currentTask.data.datetime > new Date().toISOString()
                ) {
                    console.log(`Marking Task "${currentTask.id}" as undone...`);
                    const item = await storageOperations.get({
                        where: {
                            tenant: args.tenant,
                            locale: args.locale,
                            id: currentTask.id
                        }
                    });
                    if (item) {
                        const newDateTime = updateYear(item.data.datetime, value => value - 100);
                        console.log(`newDateTime `, newDateTime);
                        await storageOperations.update({
                            item: {
                                ...item,
                                data: { ...item.data, datetime: newDateTime }
                            },
                            input: { ...item.data, datetime: newDateTime }
                        });
                    }
                }
                /**
                 * Schedule Lambda
                 */
                log(`Schedule Lambda Execution...`);
                await scheduleLambdaExecution({
                    cloudWatchEventClient,
                    invokedFunctionArn: eventContext.invokedFunctionArn,
                    datetime: nextItem.data.datetime,
                    futureDateTime
                });
                /**
                 * Update current task.
                 */
                await storageOperations.updateCurrentTask({ item: nextItem });
            }
        } catch (e) {
            log("[HANDLER_CREATE_RULE] Error => ", e);
            // TODO: Handler error. Maybe save it into DB.
        }
    }
});

interface ScheduleLambdaExecutionParams {
    datetime: string;
    cloudWatchEventClient: any;
    invokedFunctionArn: string;
    futureDateTime: string;
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
    futureDateTime
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
    console.log(JSON.stringify({ cronExpression, datetime }, null, 2));

    const ruleParams = {
        Name: RULE_NAME,
        ScheduleExpression: `cron(${cronExpression})`,
        State: "ENABLED"
    };

    const { RuleArn } = await cloudWatchEventClient.send(new PutRuleCommand(ruleParams));
    console.log("Created new Rule ARN:", RuleArn);
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
                        tenant: "root",
                        locale: "en-US",
                        invocationType: InvocationTypes.SCHEDULED,
                        futureDateTime
                    } as HandlerArgs)
                }
            ]
        })
    );
}

const isLatest = (nextDateTime: string, currentDateTime: string | null) => {
    if (!currentDateTime) {
        return true;
    }
    return nextDateTime < currentDateTime;
};

const performCheck = ({
    invocationType,
    nextDateTime,
    currentDateTime
}: {
    invocationType: "scheduled" | undefined;
    nextDateTime: string;
    currentDateTime: string | null;
}) => {
    /**
     * TODO: Make it dynamic
     */
    if (!nextDateTime.startsWith("2022")) {
        return false;
    }

    if (invocationType === "scheduled") {
        return true;
    }
    return isLatest(nextDateTime, currentDateTime);
};
