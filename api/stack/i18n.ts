import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

class I18N {
    functions: { locales: aws.lambda.Function; graphql: aws.lambda.Function };
    constructor({
        env,
        dbProxy,
        role
    }: {
        env: { [key: string]: any };
        dbProxy: aws.lambda.Function;
        role: aws.iam.Role;
    }) {
        const graphql = new aws.lambda.Function("i18n-graphql", {
            role: role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 30,
            memorySize: 512,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/i18n/graphql/build")
            }),
            environment: {
                variables: env
            }
        });

        const locales = new aws.lambda.Function("i18n-locales", {
            role: role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 30,
            memorySize: 256,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/i18n/locales/build")
            }),
            environment: {
                variables: {
                    DB_PROXY_FUNCTION: dbProxy.arn,
                    DEBUG: String(process.env.DEBUG)
                }
            }
        });

        this.functions = { graphql, locales };
    }
}

export default I18N;
