import {
    IDecompressor,
    IOperations,
    IOperationsBuilder,
    IOperationsBuilderBuildParams
} from "./types";
import { Operations, OperationType } from "~/Operations";
import { unmarshall } from "~/marshall";

interface RecordDynamoDbImage {
    data: Record<string, any>;
    ignore?: boolean;
    index: string;
}

interface RecordDynamoDbKeys {
    PK: string;
    SK: string;
}

export interface IOperationsBuilderParams {
    decompressor: IDecompressor;
}

export class OperationsBuilder implements IOperationsBuilder {
    private readonly decompressor: IDecompressor;

    public constructor(params: IOperationsBuilderParams) {
        this.decompressor = params.decompressor;
    }

    public async build(params: IOperationsBuilderBuildParams): Promise<IOperations> {
        const operations = new Operations();
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

            /**
             * On operations other than REMOVE we decompress the data and store it into the Elasticsearch.
             * No need to try to decompress if operation is REMOVE since there is no data sent into that operation.
             */
            if (
                record.eventName === OperationType.INSERT ||
                record.eventName === OperationType.MODIFY
            ) {
                const newImage = unmarshall<RecordDynamoDbImage>(record.dynamodb.NewImage);
                /**
                 * If there is no newImage, silently continue to the next operation.
                 */
                if (
                    !newImage ||
                    typeof newImage !== "object" ||
                    Object.keys(newImage).length === 0
                ) {
                    continue;
                }
                /**
                 * Note that with the `REMOVE` event, there is no `NewImage` property. Which means,
                 * if the `newImage` is `undefined`, we are dealing with a `REMOVE` event and we still
                 * need to process it.
                 */
                //
                else if (newImage.ignore === true) {
                    // Nothing to log here, we are skipping the record intentionally.
                    continue;
                }
                /**
                 * Also, possibly there is no index?
                 */
                //
                else if (!newImage.index) {
                    console.error(
                        `Could not get index from the new image, skipping event "${record.eventID}".`
                    );
                    console.log({ newImage });
                    continue;
                }
                /**
                 * We must decompress the data that is going into the Elasticsearch.
                 */
                const data = await this.decompressor.decompress(newImage.data);
                /**
                 * No point in writing null or undefined data into the Elasticsearch.
                 * This might happen on some error while decompressing. We will log it.
                 *
                 * Data should NEVER be null or undefined in the Elasticsearch DynamoDB table, unless it is a delete operations.
                 * If it is - it is a bug.
                 */
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
                /**
                 * If there is no index found, silently continue to the next operation.
                 */
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
