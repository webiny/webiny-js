import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

class GraphQLPlayground {
    function: aws.lambda.Function;
    constructor({ role }: { role: aws.iam.Role }) {
        this.function = new aws.lambda.Function("graphql-playground", {
            runtime: "nodejs12.x",
            handler: "handler.handler",
            role: role.arn,
            timeout: 30,
            memorySize: 128,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/graphqlPlayground/build")
            })
        });
    }
}

export default GraphQLPlayground;
