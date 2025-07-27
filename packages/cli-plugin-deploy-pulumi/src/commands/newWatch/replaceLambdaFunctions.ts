import fs from "fs";
import pRetry from "p-retry";
import {
    GetFunctionConfigurationCommand,
    LambdaClient,
    UpdateFunctionCodeCommand,
    UpdateFunctionConfigurationCommand
} from "@webiny/aws-sdk/client-lambda";
import { getStackExport } from "~/utils";
import { type listLambdaFunctions } from "./listLambdaFunctions";
import { Context } from "~/types";

const WATCH_MODE_NOTE_IN_DESCRIPTION = " (💡 local development mode, redeploy to remove)";
const DEFAULT_INCREASE_TIMEOUT = 120;

export interface IReplaceLambdaFunctionsParams {
    folder: string;
    env: string;
    variant?: string;
    iotEndpoint: string;
    iotEndpointTopic: string;
    sessionId: number;
    functionsList: ReturnType<typeof listLambdaFunctions>;
    increaseTimeout?: number;
    localExecutionHandshakeTimeout?: number;
    context: Context;
}

export const replaceLambdaFunctions = async ({
    folder,
    env,
    variant,
    iotEndpoint,
    iotEndpointTopic,
    sessionId,
    functionsList,
    increaseTimeout,
    localExecutionHandshakeTimeout,
    context
}: IReplaceLambdaFunctionsParams) => {
    const stackExport = getStackExport({ folder, env, variant });
    if (!stackExport) {
        // If no stack export is found, return an empty array. This is a valid scenario.
        // For example, watching the Admin app locally, but not deploying it.
        context.debug("No AWS Lambda functions to replace.");
        return [];
    }

    context.debug("replacing %s AWS Lambda function(s).", functionsList.meta.count);
    const lambdaClient = new LambdaClient();

    const replacementsPromises = functionsList.list.map(async fn => {
        const getFnConfigCmd = new GetFunctionConfigurationCommand({ FunctionName: fn.name });
        const lambdaFnConfiguration = await lambdaClient.send(getFnConfigCmd);

        const updateFnCodeCmd = new UpdateFunctionCodeCommand({
            FunctionName: fn.name,
            ZipFile: fs.readFileSync(__dirname + "/handler/handler.zip")
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
        context.debug("%s AWS Lambda function(s) replaced.", functionsList.meta.count);
        return res;
    });
};
