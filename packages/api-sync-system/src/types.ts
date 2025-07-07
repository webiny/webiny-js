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

export interface IFileLambdaPayloadInfo {
    bucket: string;
    region: string;
}

export interface ICopyFileLambdaPayload {
    action: "copyFile";
    key: string;
    source: IFileLambdaPayloadInfo;
    target: IFileLambdaPayloadInfo;
}

export interface IDeleteFileLambdaPayload {
    action: "deleteFile";
    key: string;
    target: IFileLambdaPayloadInfo;
}

export interface IUserLambdaPayloadInfo {
    region: string;
    userPoolId: string;
}

export interface IDeleteUserLambdaPayload {
    action: "deleteUser";
    username: string;
    target: IUserLambdaPayloadInfo;
}

export interface ICopyUserLambdaPayload {
    action: "createUser" | "updateUser";
    username: string;
    source: IUserLambdaPayloadInfo;
    target: IUserLambdaPayloadInfo;
}
