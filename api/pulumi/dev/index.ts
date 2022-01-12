import Graphql from "./graphql";
import HeadlessCMS from "./headlessCMS";
import ApiGateway from "./apiGateway";
import Cloudfront from "./cloudfront";
import PageBuilder from "./pageBuilder";
import PrerenderingService from "./prerenderingService";

import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import { FileManager } from "./fileManager";

// Among other things, this determines the amount of information we reveal on runtime errors.
// https://www.webiny.com/docs/how-to-guides/environment-variables/#debug-environment-variable
const DEBUG = String(process.env.DEBUG);

// Enables logs forwarding.
// https://www.webiny.com/docs/how-to-guides/use-watch-command#enabling-logs-forwarding
const WEBINY_LOGS_FORWARD_URL = String(process.env.WEBINY_LOGS_FORWARD_URL);

export default (params: { envBase: string }) => {
    const storageOutput = getStackOutput({
        folder: "apps/storage",
        env: params.envBase
    });

    const fileManagerBucketId = storageOutput.fileManagerBucketId as string;
    const primaryDynamodbTableArn = storageOutput.primaryDynamodbTableArn as string;
    const primaryDynamodbTableName = storageOutput.primaryDynamodbTableName as string;
    const cognitoUserPoolId = storageOutput.cognitoUserPoolId as string;
    const cognitoUserPoolArn = storageOutput.cognitoUserPoolArn as string;
    const cognitoUserPoolPasswordPolicy = storageOutput.cognitoUserPoolPasswordPolicy;
    const cognitoAppClientId = storageOutput.cognitoAppClientId as string;

    const fileManager = new FileManager({
        bucketId: fileManagerBucketId,
        protected: false
    });

    const prerenderingService = new PrerenderingService({
        env: {
            DB_TABLE: primaryDynamodbTableName,
            DEBUG
        },
        primaryDynamodbTableArn,
        fileManagerBucketId
    });

    const pageBuilder = new PageBuilder({
        env: {
            COGNITO_REGION: String(process.env.AWS_REGION),
            COGNITO_USER_POOL_ID: cognitoUserPoolId,
            DB_TABLE: primaryDynamodbTableName,

            S3_BUCKET: fileManagerBucketId,
            DEBUG,
            WEBINY_LOGS_FORWARD_URL
        },
        primaryDynamodbTableArn,
        fileManagerBucketId,
        cognitoUserPoolArn
    });

    const api = new Graphql({
        env: {
            COGNITO_REGION: String(process.env.AWS_REGION),
            COGNITO_USER_POOL_ID: cognitoUserPoolId,
            DB_TABLE: primaryDynamodbTableName,

            PRERENDERING_RENDER_HANDLER: prerenderingService.functions.render.arn,
            PRERENDERING_FLUSH_HANDLER: prerenderingService.functions.flush.arn,
            PRERENDERING_QUEUE_ADD_HANDLER: prerenderingService.functions.queue.add.arn,
            PRERENDERING_QUEUE_PROCESS_HANDLER: prerenderingService.functions.queue.process.arn,
            S3_BUCKET: fileManagerBucketId,
            IMPORT_PAGES_CREATE_HANDLER: pageBuilder.functions.importPages.create.arn,
            EXPORT_PAGES_PROCESS_HANDLER: pageBuilder.functions.exportPages.process.arn,
            DEBUG,
            WEBINY_LOGS_FORWARD_URL
        },
        primaryDynamodbTableArn,
        fileManagerBucketId,
        cognitoUserPoolArn
    });

    const headlessCms = new HeadlessCMS({
        env: {
            COGNITO_REGION: String(process.env.AWS_REGION),
            COGNITO_USER_POOL_ID: cognitoUserPoolId,
            DB_TABLE: primaryDynamodbTableName,
            S3_BUCKET: fileManagerBucketId,
            DEBUG,
            WEBINY_LOGS_FORWARD_URL
        },
        primaryDynamodbTableArn
    });

    const apiGateway = new ApiGateway({
        routes: [
            {
                name: "graphql-post",
                path: "/graphql",
                method: "POST",
                function: api.functions.api
            },
            {
                name: "graphql-options",
                path: "/graphql",
                method: "OPTIONS",
                function: api.functions.api
            },
            {
                name: "files-any",
                path: "/files/{path}",
                method: "ANY",
                function: fileManager.functions.download
            },
            {
                name: "cms-post",
                path: "/cms/{key+}",
                method: "POST",
                function: headlessCms.functions.graphql
            },
            {
                name: "cms-options",
                path: "/cms/{key+}",
                method: "OPTIONS",
                function: headlessCms.functions.graphql
            }
        ]
    });

    const cloudfront = new Cloudfront({ apiGateway });

    return {
        region: process.env.AWS_REGION,
        apiUrl: cloudfront.cloudfront.domainName.apply(value => `https://${value}`),
        cognitoUserPoolId: cognitoUserPoolId,
        cognitoAppClientId: cognitoAppClientId,
        cognitoUserPoolPasswordPolicy: cognitoUserPoolPasswordPolicy,
        updatePbSettingsFunction: pageBuilder.functions.updateSettings.arn,
        psQueueAdd: prerenderingService.functions.queue.add.arn,
        psQueueProcess: prerenderingService.functions.queue.process.arn,
        dynamoDbTable: primaryDynamodbTableName
    };
};
