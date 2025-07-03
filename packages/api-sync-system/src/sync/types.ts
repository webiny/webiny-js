import type { NonEmptyArray } from "@webiny/api/types.js";
import type {
    BatchGetCommand,
    BatchWriteCommand,
    DeleteCommand,
    GetCommand,
    PutCommand,
    QueryCommand,
    ScanCommand,
    UpdateCommand
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import type {
    EventBridgeClient,
    EventBridgeClientConfig,
    PutEventsCommandOutput
} from "@webiny/aws-sdk/client-eventbridge/index.js";
import type { AllCommandType, DynamoDBTableType, ExtendedCommandType } from "~/types.js";

export interface IManifestData {
    region: string;
    eventBusName: string;
    eventBusArn: string;
}

export interface IManifest {
    sync: IManifestData;
}

export type IDynamoDbCommand =
    | PutCommand
    | QueryCommand
    | ScanCommand
    | DeleteCommand
    | BatchWriteCommand
    | BatchGetCommand
    | GetCommand
    | UpdateCommand;

export interface ICommandValueItem {
    PK: string;
    SK: string;
    command: ExtendedCommandType;
    tableName: string;
    tableType: DynamoDBTableType;
}

export interface ICommandValueItemExtended extends ICommandValueItem {
    input: IDynamoDbCommand;
}

export interface ICommandValue {
    readonly command: AllCommandType;
    getItems(): NonEmptyArray<ICommandValueItemExtended> | null;
}

export interface ICommand<Result extends ICommandValue = ICommandValue> {
    name: string;
    can(input: IDynamoDbCommand): boolean;
    convert(input: IDynamoDbCommand): Result;
}

export interface ITable {
    name: string;
    arn: string;
    type: DynamoDBTableType;
}

export interface ISystem {
    name: string;
    env: string;
    variant?: string | undefined;
    region: string;
    version: string;
}

export interface IHandler {
    readonly id: string;
    flush(): Promise<PutEventsCommandOutput | null>;
    add(input: IDynamoDbCommand): void;
}

export interface ICommandConverter<Result extends ICommandValue = ICommandValue> {
    name: string;
    can(input: IDynamoDbCommand): boolean;
    convert(input: IDynamoDbCommand): Result;
}

export interface IHandlerConverter {
    register(input: ICommandConverter | ICommandConverter[]): void;
    convert(input: IDynamoDbCommand): ICommandValue;
}

export interface IGetEventBridgeCallableParams
    extends Omit<Partial<EventBridgeClientConfig>, "region"> {
    region: string;
}

export interface IGetEventBridgeCallable {
    (params: IGetEventBridgeCallableParams): Pick<EventBridgeClient, "send">;
}
