import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

class Security {
    functions: { graphql: aws.lambda.Function; validateAccessToken: aws.lambda.Function };
    constructor({
        role,
        dbProxy,
        env
    }: {
        role: aws.iam.Role;
        dbProxy: aws.lambda.Function;
        env: { [key: string]: any };
    }) {
        const validateAccessToken = new aws.lambda.Function("security-validate-access-token", {
            runtime: "nodejs12.x",
            handler: "handler.handler",
            role: role.arn,
            timeout: 30,
            memorySize: 512,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/security/validateAccessToken/build")
            }),
            environment: {
                variables: {
                    DB_PROXY_FUNCTION: dbProxy.arn,
                    DEBUG: String(process.env.DEBUG)
                }
            }
        });

        const graphql = new aws.lambda.Function("security-graphql", {
            runtime: "nodejs12.x",
            handler: "handler.handler",
            role: role.arn,
            timeout: 30,
            memorySize: 512,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/security/graphql/build")
            }),
            environment: {
                variables: {
                    ...env,
                    VALIDATE_ACCESS_TOKEN_FUNCTION: validateAccessToken.arn
                }
            }
        });

        this.functions = {
            validateAccessToken,
            graphql
        };
    }
}

export default Security;
