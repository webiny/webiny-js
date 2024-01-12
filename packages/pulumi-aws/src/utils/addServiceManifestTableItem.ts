import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { PulumiApp } from "@webiny/pulumi";
import { marshall } from "@webiny/aws-sdk/client-dynamodb";

export interface ServiceManifest {
    name: string;
    manifest: Record<string, any>;
}

export interface TableDefinition {
    tableName: pulumi.Output<string>;
    hashKey: pulumi.Output<string>;
    rangeKey: pulumi.Output<string | undefined>;
}

export const addServiceManifestTableItem = (
    app: PulumiApp,
    table: TableDefinition,
    manifest: ServiceManifest
) => {
    table.rangeKey.apply(res => {
        new aws.dynamodb.TableItem(manifest.name, {
            tableName: table.tableName,
            hashKey: table.hashKey,
            rangeKey: res,
            item: pulumi
                .all(manifest.manifest)
                .apply(res => {
                    return pulumi.interpolate`{
                "PK": "SERVICE_MANIFEST#${app.name}#${manifest.name}",
                "SK": "${app.params.run.variant || "default"}",
                "GSI1_PK": "SERVICE_MANIFESTS",
                "GSI1_SK": "${app.name}#${manifest.name}",
                "data": {
                    "name": "${manifest.name}",
                    "manifest": ${JSON.stringify(res)}
                }
            }`;
                })
                // We're using the native DynamoDB converter to avoid building those nested objects ourselves.
                .apply(v => JSON.stringify(marshall(JSON.parse(v))))
        });
    });
};
