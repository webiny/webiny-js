import Cognito from "./stack/cognito";
import Api from "./stack/api";
import ApiGateway from "./stack/apiGateway";
import Cloudfront from "./stack/cloudfront";
import GraphQlPlayground from "./stack/graphqlPlayground";

const cognito = new Cognito();

const api = new Api({
    env: {
        COGNITO_REGION: String(process.env.AWS_REGION),
        COGNITO_USER_POOL_ID: cognito.userPool.id,
        DEBUG: String(process.env.DEBUG)
    }
});

const graphqlPlayground = new GraphQlPlayground();

const apiGateway = new ApiGateway({
    routes: [
        {
            path: "/graphql",
            method: "POST",
            eventHandler: api.functions.api
        },
        {
            path: "/graphql",
            method: "OPTIONS",
            eventHandler: api.functions.api
        },
        {
            path: "/graphql",
            method: "GET",
            eventHandler: graphqlPlayground.function
        }
    ]
});

const cloudfront = new Cloudfront({ apiGateway: apiGateway.gateway });

export const region = process.env.AWS_REGION;
export const cdnDomain = cloudfront.cloudfront.domainName;
export const cognitoUserPoolId = cognito.userPool.id;
export const cognitoAppClientId = cognito.userPoolClient.id;
