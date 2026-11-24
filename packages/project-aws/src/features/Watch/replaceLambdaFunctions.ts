import pRetry from "p-retry";
import {
    GetFunctionConfigurationCommand,
    LambdaClient,
    UpdateFunctionCodeCommand,
    UpdateFunctionConfigurationCommand
} from "@webiny/aws-sdk/client-lambda/index.js";
import { type ListAppLambdaFunctionsService } from "~/abstractions/services/ListAppLambdaFunctionsService.js";
import { type LoggerService } from "@webiny/project/abstractions/index.js";
import { type UiService } from "@webiny/project/abstractions/index.js";
import { type PulumiExportService } from "~/abstractions/services/PulumiExportService.js";
import { type PulumiGetStackOutputService } from "~/abstractions/services/PulumiGetStackOutputService.js";
import { type WatchedLambdaFunctionsService } from "~/abstractions/services/WatchedLambdaFunctionsService.js";
import { type IAppModel } from "@webiny/project/abstractions/models/index.js";
import { createLambdaForwarderZip } from "./forwarder/createForwarderZip.js";
import { replaceWebFunction } from "./replaceWebFunction.js";

const WATCH_MODE_NOTE_IN_DESCRIPTION = " (💡 local development mode, redeploy to remove)";
const DEFAULT_INCREASE_TIMEOUT = 120;

export interface IReplaceLambdaFunctionsParams {
    app: IAppModel;
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
        pulumiGetStackOutputService: PulumiGetStackOutputService.Interface;
        watchedLambdaFunctionsService: WatchedLambdaFunctionsService.Interface;
    };
}

interface ApiStackOutput {
    graphqlLambdaName?: string;
    graphqlWebFunctionName?: string;
    graphqlWebEndpointName?: string;
    graphqlWebCodeBucket?: string;
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
        logger.info("No AWS Lambda functions to replace.");
        return [];
    }

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
    const forwarderZip = createLambdaForwarderZip();

    const replacementsPromises = functionsList.list.map(async fn => {
        const getFnConfigCmd = new GetFunctionConfigurationCommand({ FunctionName: fn.name });
        const lambdaFnConfiguration = await lambdaClient.send(getFnConfigCmd);

        const updateFnCodeCmd = new UpdateFunctionCodeCommand({
            FunctionName: fn.name,
            ZipFile: forwarderZip
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

    const lambdaReplacements = Promise.all(replacementsPromises).then(res => {
        logger.info("%s AWS Lambda function(s) replaced.", functionsList.meta.count);
        return res;
    });

    // The API's HTTP routes reach a Lambda web function, whose code the loop above doesn't replace.
    // Its requests are forwarded under the regular `graphql` Lambda's name, so that function must be
    // one of the forwarded ones. A failure here is reported without ending the session.
    const webFunctionReplacement = (async () => {
        if (app.name !== "api") {
            return;
        }

        try {
            const apiStackOutput =
                await dependencies.pulumiGetStackOutputService.execute<ApiStackOutput>(app);
            const graphqlFunctionName = apiStackOutput?.graphqlLambdaName;
            const isForwarded = functionNamesToUpdate.some(name => name === graphqlFunctionName);
            const webFunctionName = apiStackOutput?.graphqlWebFunctionName;
            const webEndpointName = apiStackOutput?.graphqlWebEndpointName;
            const webCodeBucket = apiStackOutput?.graphqlWebCodeBucket;
            if (!graphqlFunctionName || !isForwarded) {
                return;
            }
            if (!webFunctionName || !webEndpointName || !webCodeBucket) {
                return;
            }

            await replaceWebFunction({
                app,
                deploymentId,
                iotEndpoint,
                iotEndpointTopic,
                sessionId,
                graphqlFunctionName,
                webFunction: {
                    functionName: webFunctionName,
                    endpointName: webEndpointName,
                    codeBucket: webCodeBucket
                },
                stackResources: stackExport.deployment?.resources ?? [],
                localExecutionHandshakeTimeout,
                dependencies: {
                    loggerService: logger,
                    watchedLambdaFunctionsService
                }
            });
        } catch (error) {
            dependencies.uiService.error(
                "Could not forward the Lambda web function locally: %s",
                error.message
            );
        }
    })();

    const [res] = await Promise.all([lambdaReplacements, webFunctionReplacement]);
    return res;
};
