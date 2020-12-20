import Cognito from "./stack/cognito";
import DynamoDB from "./stack/dynamoDb";
import Graphql from "./stack/graphql";
import ApiGateway from "./stack/apiGateway";
import Cloudfront from "./stack/cloudfront";
import ElasticSearch from "./stack/elasticSearch";
import FileManager from "./stack/fileManager";
import PrerenderingService from "./stack/prerenderingService";

const dynamoDb = new DynamoDB();
const cognito = new Cognito();
const elasticSearch = new ElasticSearch();
const fileManager = new FileManager();

const prerenderingService = new PrerenderingService({ dbTable: dynamoDb.table });

const api = new Graphql({
    dynamoDbTable: dynamoDb.table,
    env: {
        ELASTIC_SEARCH_ENDPOINT: elasticSearch.domain.endpoint,
        COGNITO_REGION: String(process.env.AWS_REGION),
        COGNITO_USER_POOL_ID: cognito.userPool.id,
        DEBUG: String(process.env.DEBUG),
        S3_BUCKET: fileManager.bucket.id,
        PB_RENDER_FUNCTION: prerenderingService.functions.render.arn
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
            name: "graphql-get",
            path: "/graphql",
            method: "GET",
            function: api.functions.graphqlPlayground
        },
        {
            name: "files-any",
            path: "/files/{path}",
            method: "ANY",
            function: fileManager.functions.download
        }
        /* {
            name: "cms-get",
            path: "/cms/{key+}",
            method: "GET",
            function: graphqlPlayground.function
        },
        {
            name: "cms-post",
            path: "/cms/{key+}",
            method: "POST",
            function: headlessCms.functions.content
        },
        {
            name: "cms-options",
            path: "/cms/{key+}",
            method: "OPTIONS",
            function: headlessCms.functions.content
        }*/
    ]
});

const cloudfront = new Cloudfront({ apiGateway });

export const region = process.env.AWS_REGION;
export const cdnDomain = cloudfront.cloudfront.domainName.apply(value => `https://${value}`);
export const cognitoUserPoolId = cognito.userPool.id;
export const cognitoAppClientId = cognito.userPoolClient.id;
