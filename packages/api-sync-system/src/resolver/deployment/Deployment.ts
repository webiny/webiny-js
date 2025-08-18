import type { SemVer } from "semver";
import type { IDeployment, IDeploymentServices } from "./types";
import type { DynamoDBTableType } from "~/types.js";
import type { ITable } from "~/sync/types.js";

export type IDeploymentParams = Omit<IDeployment, "getTable">;

export class Deployment implements IDeployment {
    public readonly name: string;
    public readonly env: string;
    public readonly variant: string | undefined;
    public readonly region: string;
    public readonly services: IDeploymentServices;
    public readonly version: SemVer;

    public constructor(params: IDeploymentParams) {
        this.name = params.name;
        this.env = params.env;
        this.variant = params.variant;
        this.region = params.region;
        this.services = params.services;
        this.version = params.version;
    }

    public getTable(type: DynamoDBTableType): ITable {
        switch (type) {
            case "regular":
                return {
                    name: this.services.primaryDynamoDbName,
                    arn: this.services.primaryDynamoDbArn,
                    type
                };
            case "elasticsearch":
                if (
                    !this.services.elasticsearchDynamodbTableName ||
                    !this.services.elasticsearchDynamodbTableArn
                ) {
                    throw new Error(`Unknown table type "${type}" - no data.`);
                }
                return {
                    name: this.services.elasticsearchDynamodbTableName,
                    arn: this.services.elasticsearchDynamodbTableArn,
                    type
                };
            case "log":
                return {
                    name: this.services.logDynamodbTableName,
                    arn: this.services.logDynamodbTableArn,
                    type
                };
            default:
                throw new Error(`Unknown table type "${type}".`);
        }
    }
}

export const createDeployment = (params: IDeploymentParams): IDeployment => {
    return new Deployment(params);
};
