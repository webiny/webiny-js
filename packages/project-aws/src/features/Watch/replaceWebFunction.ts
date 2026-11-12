import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { LambdaWebClient } from "@webiny/aws-sdk/client-lambda-web/index.js";
import { CreateWebFunctionRevisionCommand } from "@webiny/aws-sdk/client-lambda-web/index.js";
import { DeleteWebFunctionRevisionCommand } from "@webiny/aws-sdk/client-lambda-web/index.js";
import { GetWebFunctionRevisionCommand } from "@webiny/aws-sdk/client-lambda-web/index.js";
import { ListWebFunctionRevisionsCommand } from "@webiny/aws-sdk/client-lambda-web/index.js";
import { UpdateWebFunctionEndpointCommand } from "@webiny/aws-sdk/client-lambda-web/index.js";
import type { ServiceConfig } from "@webiny/aws-sdk/client-lambda-web/index.js";
import { PutObjectCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { S3Client } from "@webiny/aws-sdk/client-s3/index.js";
import type { LoggerService } from "@webiny/project/abstractions/index.js";
import type { PulumiExportService } from "~/abstractions/services/PulumiExportService.js";
import type { WatchedLambdaFunctionsService } from "~/abstractions/services/WatchedLambdaFunctionsService.js";
import type { AppModel } from "@webiny/project/models/index.js";

/**
 * Marks the revisions this creates, so the next session can find and delete the old ones.
 */
const WATCH_REVISION_DESCRIPTION = "webiny watch forwarder";
const WATCH_BUNDLE_KEY = "watch.zip";
const ACTIVE_POLL_INTERVAL_MS = 2_000;
const ACTIVE_TIMEOUT_MS = 180_000;

interface StackResource {
    urn: string;
    type: string;
    outputs?: Record<string, any>;
}

interface ExpectedStackExport {
    deployment?: {
        resources?: StackResource[];
    };
}

export interface IReplaceWebFunctionParams {
    app: AppModel;
    deploymentId: string | undefined;
    iotEndpoint: string;
    iotEndpointTopic: string;
    sessionId: number;
    /**
     * The regular `graphql` Lambda. Forwarded requests run through its local handler.
     */
    graphqlFunctionName: string;
    /**
     * The web function, its endpoint and its code bucket, from the API stack's outputs.
     */
    webFunction: {
        functionName: string;
        endpointName: string;
        codeBucket: string;
    };
    localExecutionHandshakeTimeout?: number;
    dependencies: {
        loggerService: LoggerService.Interface;
        pulumiExportService: PulumiExportService.Interface;
        watchedLambdaFunctionsService: WatchedLambdaFunctionsService.Interface;
    };
}

/**
 * The web function's counterpart of `replaceLambdaFunctions`. A web function's code can't be swapped
 * in place, so this publishes a new revision that runs the forwarder (`webHandler/index.mjs`) and moves
 * the endpoint's traffic to it. The Pulumi-managed revision is marked dirty, so the next deploy
 * replaces it and the endpoint goes back to the real API.
 */
export async function replaceWebFunction(params: IReplaceWebFunctionParams): Promise<void> {
    const {
        loggerService: logger,
        pulumiExportService,
        watchedLambdaFunctionsService
    } = params.dependencies;

    const stackExport = await pulumiExportService.execute<ExpectedStackExport>(params.app);
    const resources = stackExport?.deployment?.resources ?? [];

    // The revision's URN is needed to mark it dirty, and only the stack export has it. The stack has
    // exactly one revision.
    const revision = resources.find(resource => {
        return resource.type === "aws:lambdaweb/functionRevision:FunctionRevision";
    });
    if (!revision) {
        throw new Error("The API stack has no Lambda web function revision to replace.");
    }

    const { functionName, endpointName, codeBucket } = params.webFunction;

    const lambdaWeb = new LambdaWebClient();

    const getCurrent = new GetWebFunctionRevisionCommand({
        functionName,
        revisionId: revision.outputs!.revisionId
    });
    const current = await lambdaWeb.send(getCurrent);

    const zip = createForwarderZip();
    const s3 = new S3Client();
    const putZip = new PutObjectCommand({ Bucket: codeBucket, Key: WATCH_BUNDLE_KEY, Body: zip });
    const upload = await s3.send(putZip);

    const watchArgs = JSON.stringify({
        enabled: true,
        localExecutionHandshakeTimeout: params.localExecutionHandshakeTimeout,
        sessionId: params.sessionId,
        iotEndpoint: params.iotEndpoint,
        iotEndpointTopic: params.iotEndpointTopic,
        functionName: params.graphqlFunctionName
    });

    const currentServiceConfig = current.serviceConfig;
    const serviceConfig: ServiceConfig = {
        executionRoleArn: currentServiceConfig?.executionRoleArn,
        timeoutSeconds: currentServiceConfig?.timeoutSeconds,
        maxConcurrencyPerEnvironment: currentServiceConfig?.maxConcurrencyPerEnvironment,
        egressNetworkConnectorArn: currentServiceConfig?.egressNetworkConnectorArn,
        telemetryConfig: currentServiceConfig?.telemetryConfig,
        environmentVariables: {
            ...currentServiceConfig?.environmentVariables,
            AWS_LAMBDA_NODEJS_ENTRYPOINT: "index.mjs",
            WEBINY_WATCH: watchArgs
        }
    };

    const createRevision = new CreateWebFunctionRevisionCommand({
        functionName,
        description: WATCH_REVISION_DESCRIPTION,
        buildConfig: {
            runtimeConfig: current.buildConfig?.runtimeConfig,
            codeConfig: {
                s3Object: {
                    bucket: codeBucket,
                    key: WATCH_BUNDLE_KEY,
                    versionId: upload.VersionId
                }
            }
        },
        serviceConfig
    });
    const created = await lambdaWeb.send(createRevision);
    const watchRevisionId = created.revisionId!;

    // Mark before moving traffic: from here on the endpoint may serve the forwarder.
    watchedLambdaFunctionsService.markDirty(
        { name: params.app.name, deploymentId: params.deploymentId },
        [revision.urn]
    );

    await waitUntilActive(lambdaWeb, functionName, watchRevisionId);

    const moveTraffic = new UpdateWebFunctionEndpointCommand({
        functionName,
        endpointName,
        revisionWeights: [{ revisionId: watchRevisionId, weight: 100 }]
    });
    await lambdaWeb.send(moveTraffic);
    logger.info("Lambda web function %s now forwards requests locally.", functionName);

    await deleteOldWatchRevisions(lambdaWeb, functionName, watchRevisionId);
}

/**
 * `index.mjs` is the forwarder; `mqtt.js` is taken from the regular Lambda forwarder's zip, so the two
 * forwarders use the same MQTT client build.
 */
function createForwarderZip(): Buffer {
    const lambdaForwarderZipPath = path.join(import.meta.dirname, "handler", "handler.zip");
    const lambdaForwarderZip = new AdmZip(lambdaForwarderZipPath);
    const mqtt = lambdaForwarderZip.readFile("mqtt.js");
    if (!mqtt) {
        throw new Error("The Lambda forwarder zip has no mqtt.js.");
    }

    const forwarderPath = path.join(import.meta.dirname, "webHandler", "index.mjs");
    const forwarder = fs.readFileSync(forwarderPath);

    const zip = new AdmZip();
    zip.addFile("index.mjs", forwarder);
    zip.addFile("mqtt.js", mqtt);
    return zip.toBuffer();
}

async function waitUntilActive(client: LambdaWebClient, functionName: string, revisionId: string) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < ACTIVE_TIMEOUT_MS) {
        const getRevision = new GetWebFunctionRevisionCommand({ functionName, revisionId });
        const revision = await client.send(getRevision);
        if (revision.state === "Active") {
            return;
        }
        if (revision.state === "Failed") {
            throw new Error(`Watch revision ${revisionId} failed: ${revision.stateReason}`);
        }
        await new Promise(resolve => setTimeout(resolve, ACTIVE_POLL_INTERVAL_MS));
    }
    throw new Error(`Watch revision ${revisionId} was not active after ${ACTIVE_TIMEOUT_MS} ms.`);
}

/**
 * Each session leaves its forwarder revision behind, because the next deploy only replaces the
 * Pulumi-managed one. Best effort: a failure here doesn't stop the session.
 */
async function deleteOldWatchRevisions(
    client: LambdaWebClient,
    functionName: string,
    keepRevisionId: string
) {
    try {
        const listRevisions = new ListWebFunctionRevisionsCommand({ functionName });
        const list = await client.send(listRevisions);
        for (const summary of list.revisions ?? []) {
            const isOldWatchRevision =
                summary.description === WATCH_REVISION_DESCRIPTION &&
                summary.revisionId !== keepRevisionId;
            if (!isOldWatchRevision) {
                continue;
            }
            const deleteRevision = new DeleteWebFunctionRevisionCommand({
                functionName,
                revisionId: summary.revisionId
            });
            await client.send(deleteRevision);
        }
    } catch {
        // Left for the next session to try again.
    }
}
