import Cognito from "./cognito";
import DynamoDB from "./dynamoDb";
import Graphql from "./graphql";
import HeadlessCMS from "./headlessCMS";
import ApiGateway from "./apiGateway";
import Cloudfront from "./cloudfront";
import ElasticSearch from "./elasticSearch";
import FileManager from "./fileManager";
import PageBuilder from "./pageBuilder";
import PrerenderingService from "./prerenderingService";

// Among other things, this determines the amount of information we reveal on runtime errors.
// https://www.webiny.com/docs/how-to-guides/environment-variables/#debug-environment-variable
const DEBUG = String(process.env.DEBUG);

// Enables logs forwarding.
// https://www.webiny.com/docs/how-to-guides/use-watch-command#enabling-logs-forwarding
const WEBINY_LOGS_FORWARD_URL = String(process.env.WEBINY_LOGS_FORWARD_URL);

// We protect mission critical cloud infrastructure resource against accidental deletion. We do this
// only for the "prod" environment, but, if needed, feel free to additional environments.
// https://www.pulumi.com/docs/intro/concepts/resources/#protect
const protectedEnvironment = process.env.WEBINY_ENV === "prod";

export default () => {
    const dynamoDb = new DynamoDB({ protectedEnvironment });
    const cognito = new Cognito({ protectedEnvironment });

    const elasticsearch = new ElasticSearch({ protectedEnvironment });
    const fileManager = new FileManager({ protectedEnvironment });

    const prerenderingService = new PrerenderingService({
        env: {
            DB_TABLE: dynamoDb.table.name,
            DB_TABLE_ELASTICSEARCH: elasticsearch.table.name,
            DEBUG
        },
        primaryDynamodbTable: dynamoDb.table,
        elasticsearchDynamodbTable: elasticsearch.table,
        bucket: fileManager.bucket
    });

    const pageBuilder = new PageBuilder({
        env: {
            DB_TABLE: dynamoDb.table.name,
            DB_TABLE_ELASTICSEARCH: elasticsearch.table.name,
            DEBUG
        },
        bucket: fileManager.bucket,
        primaryDynamodbTable: dynamoDb.table
    });

    const api = new Graphql({
        env: {
            COGNITO_REGION: String(process.env.AWS_REGION),
            COGNITO_USER_POOL_ID: cognito.userPool.id,
            DB_TABLE: dynamoDb.table.name,
            DB_TABLE_ELASTICSEARCH: elasticsearch.table.name,
            ELASTIC_SEARCH_ENDPOINT: elasticsearch.domain.endpoint,

            // Not required. Useful for testing purposes / ephemeral environments.
            // https://www.webiny.com/docs/key-topics/ci-cd/testing/slow-ephemeral-environments
            ELASTIC_SEARCH_INDEX_PREFIX: process.env.ELASTIC_SEARCH_INDEX_PREFIX,

            PRERENDERING_RENDER_HANDLER: prerenderingService.functions.render.arn,
            PRERENDERING_FLUSH_HANDLER: prerenderingService.functions.flush.arn,
            PRERENDERING_QUEUE_ADD_HANDLER: prerenderingService.functions.queue.add.arn,
            PRERENDERING_QUEUE_PROCESS_HANDLER: prerenderingService.functions.queue.process.arn,
            S3_BUCKET: fileManager.bucket.id,
            DEBUG,
            WEBINY_LOGS_FORWARD_URL
        },
        primaryDynamodbTable: dynamoDb.table,
        elasticsearchDynamodbTable: elasticsearch.table,
        elasticsearchDomain: elasticsearch.domain,
        bucket: fileManager.bucket,
        cognitoUserPool: cognito.userPool
    });

    const headlessCms = new HeadlessCMS({
        env: {
            COGNITO_REGION: String(process.env.AWS_REGION),
            COGNITO_USER_POOL_ID: cognito.userPool.id,
            DB_TABLE: dynamoDb.table.name,
            DB_TABLE_ELASTICSEARCH: elasticsearch.table.name,
            ELASTIC_SEARCH_ENDPOINT: elasticsearch.domain.endpoint,
            S3_BUCKET: fileManager.bucket.id,
            DEBUG,
            WEBINY_LOGS_FORWARD_URL
        },
        primaryDynamodbTable: dynamoDb.table,
        elasticsearchDynamodbTable: elasticsearch.table,
        elasticsearchDomain: elasticsearch.domain
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
        cognitoUserPoolId: cognito.userPool.id,
        cognitoAppClientId: cognito.userPoolClient.id,
        updatePbSettingsFunction: pageBuilder.functions.updateSettings.arn,
        psQueueAdd: prerenderingService.functions.queue.add.arn,
        psQueueProcess: prerenderingService.functions.queue.process.arn,
        dynamoDbTable: dynamoDb.table.name
    };
};
