import Cognito from "./stack/cognito";
import DefaultLambdaRole from "./stack/defaultLambdaRole";
import DbProxy from "./stack/dbProxy";
import Security from "./stack/security";
import SettingsManager from "./stack/settingsManager";
import I18N from "./stack/i18n";
import ApiGateway from "./stack/apiGateway";
import Cloudfront from "./stack/cloudfront";
import ApolloGateway from "./stack/apolloGateway";
import FileManager from "./stack/fileManager";
import PageBuilder from "./stack/pageBuilder";
import FormBuilder from "./stack/formBuilder";
import HeadlessCms from "./stack/headlessCms";
import GraphQLPlayground from "./stack/graphqlPlayground";

const cognito = new Cognito();
const defaultLambdaRole = new DefaultLambdaRole();
const dbProxy = new DbProxy({ role: defaultLambdaRole.role });
const settingsManager = new SettingsManager({
    role: defaultLambdaRole.role,
    dbProxy: dbProxy.function
});

const graphqlServiceEnv: { [key: string]: any } = {
    COGNITO_REGION: String(process.env.AWS_REGION),
    COGNITO_USER_POOL_ID: cognito.userPool.id,
    DEBUG: String(process.env.DEBUG),
    DB_PROXY_FUNCTION: dbProxy.function.arn,
    GRAPHQL_INTROSPECTION: String(process.env.GRAPHQL_INTROSPECTION),
    GRAPHQL_PLAYGROUND: String(process.env.GRAPHQL_PLAYGROUND),
    JWT_TOKEN_EXPIRES_IN: String(process.env.JWT_TOKEN_EXPIRES_IN),
    JWT_TOKEN_SECRET: String(process.env.JWT_TOKEN_EXPIRES_IN),
    SETTINGS_MANAGER_FUNCTION: settingsManager.functions.settings.arn
};

const security = new Security({
    role: defaultLambdaRole.role,
    dbProxy: dbProxy.function,
    env: graphqlServiceEnv
});

graphqlServiceEnv.VALIDATE_ACCESS_TOKEN_FUNCTION = security.functions.validateAccessToken.arn;
graphqlServiceEnv.PERMISSIONS_MANAGER_FUNCTION = security.functions.permissionsManager.arn;

const i18n = new I18N({
    role: defaultLambdaRole.role,
    dbProxy: dbProxy.function,
    env: graphqlServiceEnv
});

const fileManager = new FileManager({
    role: defaultLambdaRole.role,
    env: {
        graphql: graphqlServiceEnv
    }
});

const pageBuilder = new PageBuilder({
    bucket: fileManager.bucket,
    role: defaultLambdaRole.role,
    env: { graphql: graphqlServiceEnv }
});

const formBuilder = new FormBuilder({
    role: defaultLambdaRole.role,
    i18nLocalesFunction: i18n.functions.locales,
    env: {
        graphql: graphqlServiceEnv
    }
});

const headlessCms = new HeadlessCms({
    role: defaultLambdaRole.role,
    i18nLocalesFunction: i18n.functions.locales,
    settingsManagerFunction: settingsManager.functions.settings,
    env: {
        graphql: graphqlServiceEnv,
        content: graphqlServiceEnv
    }
});

const apolloGateway = new ApolloGateway({
    role: defaultLambdaRole.role,
    env: {
        ...graphqlServiceEnv,
        LAMBDA_SERVICE_SECURITY: security.functions.graphql.arn,
        LAMBDA_SERVICE_I18N: i18n.functions.graphql.arn,
        LAMBDA_SERVICE_FILE_MANAGER: fileManager.functions.graphql.arn,
        LAMBDA_SERVICE_PAGE_BUILDER: pageBuilder.functions.graphql.arn,
        LAMBDA_SERVICE_FORM_BUILDER: formBuilder.functions.graphql.arn,
        LAMBDA_SERVICE_HEADLESS_CMS: headlessCms.functions.graphql.arn
    }
});

const graphqlPlayground = new GraphQLPlayground({ role: defaultLambdaRole.role });

const apiGateway = new ApiGateway({
    routes: [
        {
            path: "/graphql",
            method: "POST",
            eventHandler: apolloGateway.functions.gateway
        },
        {
            path: "/graphql",
            method: "OPTIONS",
            eventHandler: apolloGateway.functions.gateway
        },
        {
            path: "/graphql",
            method: "GET",
            eventHandler: graphqlPlayground.function
        },
        {
            path: "/files/{path}",
            method: "ANY",
            eventHandler: fileManager.functions.download
        },
        {
            path: "/cms/{key+}",
            method: "ANY",
            eventHandler: headlessCms.functions.content
        }
    ]
});

const cloudfront = new Cloudfront({ apiGateway: apiGateway.gateway });

export const region = process.env.AWS_REGION;
export const cdnDomain = cloudfront.cloudfront.domainName;
export const cognitoUserPoolId = cognito.userPool.id;
export const cognitoAppClientId = cognito.userPoolClient.id;
