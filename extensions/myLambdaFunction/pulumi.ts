import { ApiPulumi } from "webiny/infra/api";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import path from "path";

class MyApiPulumiHandlerImpl implements ApiPulumi.Interface {
    execute(app: any) {
        // TODO: having something like app.addLambdaFunction() would be nice,
        // TODO: but for now, we can just use `app.addResource()` directly.
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
