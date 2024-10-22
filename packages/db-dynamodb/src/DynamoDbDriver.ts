import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { DbDriver } from "@webiny/db";

interface ConstructorArgs {
    documentClient: DynamoDBDocument;
}

class DynamoDbDriver implements DbDriver<DynamoDBDocument> {
    public readonly documentClient: DynamoDBDocument;
    constructor({ documentClient }: ConstructorArgs) {
        this.documentClient = documentClient;
    }

    getClient() {
        return this.documentClient;
    }
}

export default DynamoDbDriver;
