import fs from "fs";
import pRetry from "p-retry";
import {
    GetFunctionConfigurationCommand,
    LambdaClient,
    UpdateFunctionCodeCommand,
    UpdateFunctionConfigurationCommand
} from "@webiny/aws-sdk/client-lambda/index.js";
import {
    type ListAppLambdaFunctionsService,
    type LoggerService,
    type PulumiExportService,
    type WatchedLambdaFunctionsService,
    type UiService
} from "~/abstractions/index.js";
import { type AppModel } from "~/models/index.js";

const WATCH_MODE_NOTE_IN_DESCRIPTION = " (💡 local development mode, redeploy to remove)";
const DEFAULT_INCREASE_TIMEOUT = 120;

export interface IReplaceLambdaFunctionsParams {
    app: AppModel;
    deploymentId: string | undefined;
    iotEndpoint: string;
    iotEndpointTopic: string;
    sessionId: number;
    functionsList: ListAppLambdaFunctionsService.Result;
    increaseTimeout?: number;
    localExecutionHandshakeTimeout?: number;
    dependencies: {
        uiService: UiService.Interface;
        loggerService: LoggerService.Interface;
        pulumiExportService: PulumiExportService.Interface;
        watchedLambdaFunctionsService: WatchedLambdaFunctionsService.Interface;
    };
}

export const replaceLambdaFunctions = async ({
    app,
    deploymentId,
    iotEndpoint,
    iotEndpointTopic,
    sessionId,
    functionsList,
    increaseTimeout,
    localExecutionHandshakeTimeout,
    dependencies
}: IReplaceLambdaFunctionsParams) => {
    const {
        loggerService: logger,
        pulumiExportService: exportStackState,
        watchedLambdaFunctionsService
    } = dependencies;

    const stackExport = await exportStackState.execute(app);
    if (!stackExport) {
        // If no stack export is found, return an empty array. This is a valid scenario.
        // For example, watching the Admin app locally, but not deploying it.
        logger.info("No AWS Lambda functions to replace.");
        return [];
    }

    // Find the URNs of Lambda functions that will be replaced
    const functionNamesToUpdate = functionsList.list.map(fn => fn.name);
    const replacedFunctionUrns: string[] = [];

    if (stackExport.deployment?.resources) {
        for (const resource of stackExport.deployment.resources) {
            if (resource.type === "aws:lambda/function:Function") {
                const functionName = resource.inputs?.name;
                if (functionName && functionNamesToUpdate.includes(functionName)) {
                    replacedFunctionUrns.push(resource.urn);
                    logger.debug(`Will replace Lambda function: ${functionName} (${resource.urn})`);
                }
            }
        }
    }

    // Mark these functions as needing replacement on next deployment
    if (replacedFunctionUrns.length > 0) {
        watchedLambdaFunctionsService.markDirty(
            { name: app.name, deploymentId },
            replacedFunctionUrns
        );
        logger.info(
            `Marked ${replacedFunctionUrns.length} Lambda function(s) for replacement on next deployment.`
        );
    }

    logger.info("replacing %s AWS Lambda function(s).", functionsList.meta.count);
    const lambdaClient = new LambdaClient();

    const replacementsPromises = functionsList.list.map(async fn => {
        const getFnConfigCmd = new GetFunctionConfigurationCommand({ FunctionName: fn.name });
        const lambdaFnConfiguration = await lambdaClient.send(getFnConfigCmd);

        const updateFnCodeCmd = new UpdateFunctionCodeCommand({
            FunctionName: fn.name,
            ZipFile: fs.readFileSync(import.meta.dirname + "/handler/handler.zip")
        });

        await lambdaClient.send(updateFnCodeCmd);

        let Description = lambdaFnConfiguration.Description || "";
        if (!Description.endsWith(WATCH_MODE_NOTE_IN_DESCRIPTION)) {
            Description += WATCH_MODE_NOTE_IN_DESCRIPTION;
        }

        const Timeout = increaseTimeout || DEFAULT_INCREASE_TIMEOUT;

        await pRetry(() =>
            lambdaClient.send(
                new UpdateFunctionConfigurationCommand({
                    FunctionName: fn.name,
                    Timeout,
                    Description,
                    Environment: {
                        Variables: {
                            ...lambdaFnConfiguration.Environment?.Variables,
                            WEBINY_WATCH: JSON.stringify({
                                enabled: true,
                                localExecutionHandshakeTimeout,
                                sessionId,
                                iotEndpoint,
                                iotEndpointTopic,
                                functionName: fn.name
                            })
                        }
                    }
                })
            )
        );
    });

    return Promise.all(replacementsPromises).then(res => {
        logger.info("%s AWS Lambda function(s) replaced.", functionsList.meta.count);
        return res;
    });
};
