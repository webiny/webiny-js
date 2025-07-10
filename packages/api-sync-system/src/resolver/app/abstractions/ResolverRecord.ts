import type { GenericRecord } from "@webiny/api/types.js";
import type { IDetail } from "~/sync/handler/types.js";
import type { DynamoDBTableType, ExtendedCommandType } from "~/types.js";
import { SQS_EVENT_NAME } from "~/constants.js";

export interface IResolverRecordBodyItem {
    PK: string;
    SK: string;
    command: ExtendedCommandType;
    /**
     * There will be multiple tables that will get populated through the system (regular table and elasticsearch for start).
     */
    tableName: string;
    tableType: DynamoDBTableType;
}

export interface IResolverSQSRecordBody {
    version: `${number}`;
    id: string;
    "detail-type": typeof SQS_EVENT_NAME;
    source: `webiny:${string}`;
    account: `${number}`;
    time: Date;
    region: string;
    resources: unknown[];
    detail: IDetail;
}

export interface IResolverSQSRecordAttributes {
    ApproximateReceiveCount: string;
    SentTimestamp: string;
    SenderId: string;
    ApproximateFirstReceiveTimestamp: string;
}

export interface IResolverSQSRecord {
    messageId: string;
    receiptHandle: string;
    body: IResolverSQSRecordBody;
    attributes: IResolverSQSRecordAttributes;
    messageAttributes?: GenericRecord;
    md5OfBody: string;
    eventSource: string;
    eventSourceARN: string;
    awsRegion: string;
}
