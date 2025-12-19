import type {
    DynamoDBStreamEvent,
    DynamoDBRecord,
    Context as LambdaContext
} from "@webiny/aws-sdk/types/index.js";
import { CloudFunction } from "../createFunction.js";
import type { Container } from "@webiny/di";
import type { CreateFunctionOptions, FunctionSetup } from "../types.js";

export interface DynamoDBResult {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

/**
 * Abstract class for DynamoDB Stream Lambda functions with DI support
 */
export abstract class DynamoDBFunction extends CloudFunction<DynamoDBStreamEvent, DynamoDBResult> {
    /**
     * Handle the DynamoDB Stream event (processes all records)
     */
    abstract execute(event: DynamoDBStreamEvent): Promise<DynamoDBResult>;

    /**
     * Process a single DynamoDB record (optional, override for record-by-record processing)
     */
    protected async processRecord(record: DynamoDBRecord): Promise<void> {
        // Override in subclass
    }

    /**
     * Helper method to process all records individually
     */
    protected async processRecords(event: DynamoDBStreamEvent): Promise<DynamoDBResult> {
        let processedCount = 0;

        for (const record of event.Records) {
            try {
                await this.processRecord(record);
                processedCount++;
            } catch (error) {
                console.error(`Failed to process DynamoDB record:`, error);
                throw error;
            }
        }

        return {
            success: true,
            processedRecords: processedCount
        };
    }

    /**
     * Check if record is an INSERT event
     */
    protected isInsert(record: DynamoDBRecord): boolean {
        return record.eventName === "INSERT";
    }

    /**
     * Check if record is a MODIFY event
     */
    protected isModify(record: DynamoDBRecord): boolean {
        return record.eventName === "MODIFY";
    }

    /**
     * Check if record is a REMOVE event
     */
    protected isRemove(record: DynamoDBRecord): boolean {
        return record.eventName === "REMOVE";
    }

    /**
     * Get the new image (after change)
     */
    protected getNewImage(record: DynamoDBRecord) {
        return record.dynamodb?.NewImage;
    }

    /**
     * Get the old image (before change)
     */
    protected getOldImage(record: DynamoDBRecord) {
        return record.dynamodb?.OldImage;
    }

    /**
     * Get the keys
     */
    protected getKeys(record: DynamoDBRecord) {
        return record.dynamodb?.Keys;
    }
}

/**
 * Factory function to create DynamoDB Stream handlers with DI
 */
export function createDynamoDBFunction<T extends DynamoDBFunction>(
    FunctionClass: new (container: Container) => T,
    setup?: FunctionSetup,
    options?: CreateFunctionOptions
) {
    let functionInstance: T | null = null;

    return async (
        event: DynamoDBStreamEvent,
        context: LambdaContext
    ): Promise<DynamoDBResult> => {
        // Initialize on cold start
        if (!functionInstance) {
            const container = new Container();

            // Run user setup
            if (setup) {
                await setup(container);
            }

            // Create function instance
            functionInstance = new FunctionClass(container);
        }

        // Handle the event
        return functionInstance.handle(event);
    };
}

export type { DynamoDBStreamEvent, DynamoDBRecord, DynamoDBResult };

