import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

class HeadlessCms {
    functions: {
        graphql: aws.lambda.Function;
        dataManager: aws.lambda.Function;
        content: aws.lambda.Function;
    };
    constructor({
        role,
        env,
        i18nLocalesFunction,
        settingsManagerFunction
    }: {
        role: aws.iam.Role;
        settingsManagerFunction: aws.lambda.Function;
        i18nLocalesFunction: aws.lambda.Function;
        env: { content: { [key: string]: any }; graphql: { [key: string]: any } };
    }) {
        const dataManager = new aws.lambda.Function("cms-data-manager", {
            runtime: "nodejs12.x",
            handler: "handler.handler",
            role: role.arn,
            timeout: 30,
            memorySize: 512,
            description: "CMS Data Manager",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/cms/dataManager/build")
            }),
            environment: {
                variables: {
                    MONGODB_SERVER: process.env.MONGODB_SERVER || "",
                    MONGODB_NAME: process.env.MONGODB_NAME || "",
                    I18N_LOCALES_FUNCTION: i18nLocalesFunction.arn // TODO: use settings manager instead of this function?
                }
            }
        });

        const graphql = new aws.lambda.Function("cms-graphql", {
            runtime: "nodejs12.x",
            handler: "handler.handler",
            role: role.arn,
            timeout: 30,
            memorySize: 512,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/cms/graphql/build")
            }),
            environment: {
                variables: {
                    ...env.graphql,
                    CMS_DATA_MANAGER_FUNCTION: dataManager.arn
                }
            }
        });

        const content = new aws.lambda.Function("cms-content", {
            runtime: "nodejs12.x",
            handler: "handler.handler",
            role: role.arn,
            timeout: 30,
            memorySize: 512,
            description: "CMS Content API",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/cms/content/build")
            }),
            environment: {
                variables: {
                    ...env.content,
                    I18N_LOCALES_FUNCTION: i18nLocalesFunction.arn,
                    CMS_DATA_MANAGER_FUNCTION: dataManager.arn,
                    SETTINGS_MANAGER_FUNCTION: settingsManagerFunction.arn
                }
            }
        });

        this.functions = { dataManager, graphql, content };
    }
}

export default HeadlessCms;
