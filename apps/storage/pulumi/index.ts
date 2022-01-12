import { tagResources } from "@webiny/cli-plugin-deploy-pulumi/utils";

import { DynamoDB } from "./dynamoDb";
import { Cognito } from "./cognito";
import { FileManagerStorage } from "./fileManagerStorage";

// By default, we only deploy "prod" stack when the WEBINY_ENV environment variable is equal to "prod".
// But do note that it's recommended the same application code and cloud infrastructure resources are
// deployed into staging environments too (these should be as equal to the prod environment as possible).
// For cost reasons, by default this is disabled, but feel free to uncomment the "staging" environment.
// https://www.webiny.com/docs/key-topics/ci-cd/environments/staging-prod-deployments
const PROD_STACK_ENVIRONMENTS = ["prod" /*"staging"*/];

export = async () => {
    // Add tags to all resources that support tagging. Read more about the default environment variables:
    // https://www.webiny.com/docs/how-to-guides/environment-variables#webiny-environment-variables
    tagResources({
        WbyProjectName: process.env.WEBINY_PROJECT_NAME as string,
        WbyEnvironment: process.env.WEBINY_ENV as string
    });

    const environment = process.env.WEBINY_ENV as string;

    const production = PROD_STACK_ENVIRONMENTS.includes(environment);

    const db = new DynamoDB({
        protected: production
    });

    const cognito = new Cognito({
        protected: production
    });

    const fileManagerStorage = new FileManagerStorage({
        protected: production
    });

    return {
        fileManagerBucketId: fileManagerStorage.bucket.id,
        primaryDynamodbTableArn: db.table.arn,
        primaryDynamodbTableName: db.table.name,
        cognitoUserPoolId: cognito.userPool.id,
        cognitoUserPoolArn: cognito.userPool.arn,
        cognitoUserPoolPasswordPolicy: cognito.userPool.passwordPolicy,
        cognitoAppClientId: cognito.userPoolClient.id
    };
};
