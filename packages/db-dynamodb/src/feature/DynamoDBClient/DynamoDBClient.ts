import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { DynamoDBClient as Abstraction } from "./abstractions.js";

export interface IDynamoDBClientParams {
    client: DynamoDBDocument;
}

export class DynamoDBClient implements Abstraction.Interface {
    private readonly client: DynamoDBDocument;

    public constructor(params: IDynamoDBClientParams) {
        this.client = params.client;
    }

    public getDocumentClient(): DynamoDBDocument {
        return this.client;
    }
}
