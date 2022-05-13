import { dateTimeToCronExpression, moveDateTimeToCurrentCentury } from "~/scheduler/handlers/utils";
import { ApwScheduleAction } from "~/scheduler/types";
import {
    HandlerArgs,
    InvocationTypes,
    Configuration
} from "~/scheduler/handlers/scheduleAction/index";
import {
    DeleteRuleCommand,
    RemoveTargetsCommand,
    PutTargetsCommand,
    PutRuleCommand
} from "@aws-sdk/client-cloudwatch-events";
import { ClientContext } from "@webiny/handler-client/types";
import { getApwSettings } from "~/scheduler/handlers/utils";

const log = console.log;

interface ScheduleLambdaExecutionParams extends Omit<HandlerArgs, "invocationType"> {
    cloudWatchEventClient: any;
    invokedFunctionArn: string;
}

/**
 * Current API limit/quota for Cloudwatch events is sufficient for now. But, we should watch for it;
 * in case of scheduling becoming the most frequently used feature.
 * https://aws.amazon.com/about-aws/whats-new/2017/07/cloudwatch-events-increases-rules-and-api-requests-limits/
 */
export async function scheduleLambdaExecution({
    cloudWatchEventClient,
    invokedFunctionArn,
    datetime,
    futureDatetime,
    tenant,
    locale
}: ScheduleLambdaExecutionParams) {
    const { eventTargetId, eventRuleName } = await getApwSettings();
    /**
     * Remove the target
     */
    const removeTargetsCommand = new RemoveTargetsCommand({
        Rule: eventRuleName,
        Ids: [eventTargetId]
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
        Name: eventRuleName
    });
    await cloudWatchEventClient.send(deleteRuleCommand);

    /**
     * Create a new one.
     * Min  H   D   M   DW  Y
     * 20   10  10  03  *   2022
     */
    const cronExpression = dateTimeToCronExpression(datetime);

    const ruleParams = {
        Name: eventRuleName,
        ScheduleExpression: `cron(${cronExpression})`,
        State: "ENABLED",
        Description: `Enable us to schedule an action in publishing workflow at a particular datetime`
    };

    await cloudWatchEventClient.send(new PutRuleCommand(ruleParams));
    /**
     * Add lambda as target for the rule.
     */
    await cloudWatchEventClient.send(
        new PutTargetsCommand({
            Rule: eventRuleName,
            Targets: [
                {
                    Arn: invokedFunctionArn,
                    Id: eventTargetId,
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

export const shouldScheduleTask = (
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

export const restoreDateTime = async ({
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

interface ExecuteTaskParams
    extends Pick<ClientContext, "handlerClient">,
        Pick<Configuration, "storageOperations"> {
    args: HandlerArgs;
    lambdaName: string;
}

export const executeTask = async ({
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
