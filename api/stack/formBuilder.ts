import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import vpc from "./vpc";
import defaultLambdaRole from "./defaultLambdaRole";

class FormBuilder {
    functions: {
        graphql: aws.lambda.Function;
    };
    constructor({
        env,
        i18nLocalesFunction
    }: {
        i18nLocalesFunction: aws.lambda.Function;
        env: { graphql: { [key: string]: any } };
    }) {
        this.functions = {
            graphql: new aws.lambda.Function("fb-graphql", {
                runtime: "nodejs12.x",
                handler: "handler.handler",
                role: defaultLambdaRole.role.arn,
                timeout: 30,
                memorySize: 512,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive("./code/formBuilder/build")
                }),
                environment: {
                    variables: {
                        ...env.graphql,
                        I18N_LOCALES_FUNCTION: i18nLocalesFunction.arn
                    }
                },
                vpcConfig: {
                    subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                    securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
                }
            })
        };
    }
}

export default FormBuilder;
