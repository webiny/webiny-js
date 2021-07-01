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

/**
 * We protect mission critical cloud infrastructure resource against accidental deletion. We do this
 * only for the "prod" environment, but, if needed, feel free to additional environments.
 * @see https://www.pulumi.com/docs/intro/concepts/resources/#protect
 */
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
            DEBUG: String(process.env.DEBUG)
        }
    });

    const pageBuilder = new PageBuilder({
        env: {
            DB_TABLE: dynamoDb.table.name,
            DB_TABLE_ELASTICSEARCH: elasticsearch.table.name,
            DEBUG: String(process.env.DEBUG)
        },
        bucket: fileManager.bucket
    });

    const api = new Graphql({
        env: {
            COGNITO_REGION: String(process.env.AWS_REGION),
            COGNITO_USER_POOL_ID: cognito.userPool.id,
            DB_TABLE: dynamoDb.table.name,
            DB_TABLE_ELASTICSEARCH: elasticsearch.table.name,
            DEBUG: String(process.env.DEBUG),
            ELASTIC_SEARCH_ENDPOINT: elasticsearch.domain.endpoint,

            // Not required. Useful for testing purposes / ephemeral environments.
            // https://www.webiny.com/docs/key-topics/ci-cd/testing/slow-ephemeral-environments
            ELASTIC_SEARCH_INDEX_PREFIX: process.env.ELASTIC_SEARCH_INDEX_PREFIX,

            PRERENDERING_RENDER_HANDLER: prerenderingService.functions.render.arn,
            PRERENDERING_FLUSH_HANDLER: prerenderingService.functions.flush.arn,
            PRERENDERING_QUEUE_ADD_HANDLER: prerenderingService.functions.queue.add.arn,
            PRERENDERING_QUEUE_PROCESS_HANDLER: prerenderingService.functions.queue.process.arn,
            S3_BUCKET: fileManager.bucket.id,
            WEBINY_LOGS_FORWARD_URL: String(process.env.WEBINY_LOGS_FORWARD_URL)
        }
    });

    const headlessCms = new HeadlessCMS({
        env: {
            COGNITO_REGION: String(process.env.AWS_REGION),
            COGNITO_USER_POOL_ID: cognito.userPool.id,
            DB_TABLE: dynamoDb.table.name,
            DB_TABLE_ELASTICSEARCH: elasticsearch.table.name,
            DEBUG: String(process.env.DEBUG),
            ELASTIC_SEARCH_ENDPOINT: elasticsearch.domain.endpoint,
            S3_BUCKET: fileManager.bucket.id,
            WEBINY_LOGS_FORWARD_URL: String(process.env.WEBINY_LOGS_FORWARD_URL)
        }
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
