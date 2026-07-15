import type { DynamoDBRecord } from "@webiny/aws-sdk/types/index.js";
import {
    OperationsBuilder,
    type IOperationsBuilder
} from "@webiny/api-sync-to-opensearch/features/OperationsBuilder/abstraction.js";
import { OperationType } from "@webiny/api-sync-to-opensearch/features/Operations/Operations.js";
import type { Operations } from "@webiny/api-sync-to-opensearch/features/Operations/abstraction.js";
import { OperationsFactory } from "@webiny/api-sync-to-opensearch/features/Operations/abstraction.js";
import { unmarshall } from "~/marshall.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";

interface RecordDynamoDbImage {
    data: {
        compression: string;
        value: string;
    };
    ignore?: boolean;
    index: string;
}

interface RecordDynamoDbKeys {
    PK: string;
    SK: string;
}

class DdbOperationsBuilderImpl implements IOperationsBuilder<DynamoDBRecord> {
    public constructor(
        private readonly compressor: CompressionHandler.Interface,
        private readonly operationsFactory: OperationsFactory.Interface
    ) {}

    public async build(params: { records: DynamoDBRecord[] }): Promise<Operations.Interface> {
        const operations = this.operationsFactory.create();
        for (const record of params.records) {
            if (!record.dynamodb) {
                continue;
            } else if (!record.eventName) {
                console.error(
                    `Could not get operation from the record, skipping event "${record.eventID}".`
                );
                continue;
            }

            const keys = unmarshall<RecordDynamoDbKeys>(record.dynamodb.Keys);
            if (!keys?.PK || !keys.SK) {
                console.error(
                    `Could not get keys from the record, skipping event "${record.eventID}".`
                );
                continue;
            }

            const id = `${keys.PK}:${keys.SK}`;

            if (
                record.eventName === OperationType.INSERT ||
                record.eventName === OperationType.MODIFY
            ) {
                const newImage = unmarshall<RecordDynamoDbImage>(record.dynamodb.NewImage);
                if (
                    !newImage ||
                    typeof newImage !== "object" ||
                    Object.keys(newImage).length === 0
                ) {
                    continue;
                } else if (newImage.ignore === true) {
                    continue;
                } else if (!newImage.index) {
                    console.error(
                        `Could not get index from the new image, skipping event "${record.eventID}".`
                    );
                    console.log({ newImage });
                    continue;
                }
                const data = await this.compressor.decompress(newImage.data);
                if (data === undefined || data === null) {
                    console.error(
                        `Could not get decompressed data, skipping ES operation "${record.eventName}", ID ${id}. Skipping...`
                    );
                    continue;
                }

                operations.insert({
                    id,
                    index: newImage.index,
                    data
                });
            } else if (record.eventName === OperationType.REMOVE) {
                const oldImage = unmarshall<RecordDynamoDbImage>(record.dynamodb.OldImage);
                if (!oldImage?.index) {
                    continue;
                }
                operations.delete({
                    id,
                    index: oldImage.index
                });
            }
        }
        return operations;
    }
}

export const DdbOperationsBuilderImplementation = OperationsBuilder.createImplementation({
    implementation: DdbOperationsBuilderImpl,
    dependencies: [CompressionHandler, OperationsFactory]
});
