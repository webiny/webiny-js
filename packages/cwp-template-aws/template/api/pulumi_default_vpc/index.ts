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

const dynamoDb = new DynamoDB();
const cognito = new Cognito();
const elasticSearch = new ElasticSearch();
const fileManager = new FileManager();

const prerenderingService = new PrerenderingService({
    env: {
        DB_TABLE: dynamoDb.table.name,
        DEBUG: String(process.env.DEBUG)
    }
});

const pageBuilder = new PageBuilder({
    env: {
        DB_TABLE: dynamoDb.table.name,
        DEBUG: String(process.env.DEBUG)
    }
});

const api = new Graphql({
    env: {
        COGNITO_REGION: String(process.env.AWS_REGION),
        COGNITO_USER_POOL_ID: cognito.userPool.id,
        DB_TABLE: dynamoDb.table.name,
        DEBUG: String(process.env.DEBUG),
        ELASTIC_SEARCH_ENDPOINT: elasticSearch.domain.endpoint,
        PRERENDERING_RENDER_HANDLER: prerenderingService.functions.render.arn,
        PRERENDERING_FLUSH_HANDLER: prerenderingService.functions.flush.arn,
        PRERENDERING_QUEUE_ADD_HANDLER: prerenderingService.functions.queue.add.arn,
        PRERENDERING_QUEUE_PROCESS_HANDLER: prerenderingService.functions.queue.process.arn,
        S3_BUCKET: fileManager.bucket.id
    }
});

const headlessCms = new HeadlessCMS({
    env: {
        COGNITO_REGION: String(process.env.AWS_REGION),
        COGNITO_USER_POOL_ID: cognito.userPool.id,
        DB_TABLE: dynamoDb.table.name,
        DEBUG: String(process.env.DEBUG),
        ELASTIC_SEARCH_ENDPOINT: elasticSearch.domain.endpoint,
        S3_BUCKET: fileManager.bucket.id
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

export const region = process.env.AWS_REGION;
export const apiUrl = cloudfront.cloudfront.domainName.apply(value => `https://${value}`);
export const cognitoUserPoolId = cognito.userPool.id;
export const cognitoAppClientId = cognito.userPoolClient.id;
export const updatePbSettingsFunction = pageBuilder.functions.updateSettings.arn;
