import { Context as BaseContext } from "@webiny/handler-aws/types";

export type CommandType = "put" | "delete";
export type ExtendedCommandType = "put" | "delete" | "update";
export type AllCommandType = ExtendedCommandType | "batchWrite" | "null";

export enum DynamoDBTableType {
    REGULAR = "regular",
    ELASTICSEARCH = "elasticsearch",
    LOG = "log",
    UNKNOWN = "unknown"
}

export interface Context extends BaseContext {}
