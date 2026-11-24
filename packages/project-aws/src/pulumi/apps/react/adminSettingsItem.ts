import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { PulumiApp } from "@webiny/pulumi";
import type { CoreOutput } from "~/pulumi/apps/common/CoreOutput.js";

export interface AdminSettingsItemParams {
    core: CoreOutput;
    cloudfront: { output: { domainName: pulumi.Output<string> } };
    /* The project has `<Infra.AuroraPostgres />`. */
    usesPostgres: boolean;
}

/**
 * Stores the app's URL in the `ADMIN#SETTINGS` item of the core's DynamoDB table. With
 * `<Infra.AuroraPostgres />` the core has no DynamoDB table, and nothing on Postgres reads it.
 */
export const addAdminSettingsItem = (app: PulumiApp, params: AdminSettingsItemParams) => {
    if (params.usesPostgres) {
        return null;
    }

    const { core, cloudfront } = params;

    return app.addResource(aws.dynamodb.TableItem, {
        name: "adminSettings",
        config: {
            tableName: core.primaryDynamodbTableName,
            hashKey: core.primaryDynamodbTableHashKey,
            rangeKey: pulumi.output(core.primaryDynamodbTableRangeKey).apply(key => key || "SK"),
            item: pulumi.interpolate`{
                          "PK": {"S": "ADMIN#SETTINGS"},
                          "SK": {"S": "default"},
                          "data": {
                            "M": {
                              "appUrl": {
                                "S": "${cloudfront.output.domainName.apply(
                                    value => `https://${value}`
                                )}"
                              }
                            }
                          }
                        }`
        }
    });
};
