import * as pulumi from "@pulumi/pulumi";
import { S3 } from "@webiny/aws-sdk/client-s3";

// Define the shape of our resource inputs with this interface
interface ServiceDiscoveryArgs {
    bucket: pulumi.Output<string>;
    name: string;
    manifest: pulumi.Input<Record<string, any>>;
}

export class ServiceDiscovery extends pulumi.ComponentResource<{ serviceManifest: string }> {
    private basePath = "__serviceDiscovery/default";
    private serviceManifest: pulumi.Output<string>;

    constructor(name: string, args: ServiceDiscoveryArgs) {
        // Register this component with name examples:S3Folder
        super("webiny:aws:ServiceDiscovery", name, args);

        this.serviceManifest = args.bucket.apply(async bucketId => {
            const s3 = new S3({ region: process.env.AWS_REGION });

            const manifestKey = `${this.basePath}/${args.name}.json`;

            pulumi.all(args.manifest).apply(manifest => {
                // TODO: load existing file and update if exists
                return s3.putObject({
                    Bucket: bucketId,
                    Key: manifestKey,
                    Body: JSON.stringify({ name: args.name, manifest }),
                    ContentType: "application/json"
                });
            });

            return manifestKey;
        });

        this.registerOutputs();
    }
}
