import { ApiPulumi } from "webiny/infra/api";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import path from "path";

class MyApiPulumiHandlerImpl implements ApiPulumi.Interface {
    execute(app: any) {
        app.addResource(aws.lambda.Function, {
            name: "myLambdaFunction",
            config: {
                description: "My custom Lambda function created using Pulumi",
                runtime: "nodejs24.x",
                handler: "handler.handler",
                // role: role.output.arn,
                timeout: 30,
                memorySize: 1024,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive(
                        path.join(app.paths.workspace, "myLambdaFunction/build")
                    )
                }),
                environment: {
                    // variables: getCommonLambdaEnvVariables().apply(value => ({
                    //     ...value,
                    //     // ...params.env,
                    //     AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1"
                    // }))
                },
                // vpcConfig: app.getModule(VpcConfig).functionVpcConfig,
                loggingConfig: {
                    logFormat: "JSON"
                }
            }
        });
    }
}

export default ApiPulumi.createImplementation({
    implementation: MyApiPulumiHandlerImpl,
    dependencies: []
});
