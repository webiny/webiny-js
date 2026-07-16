import { OperationsBuilder } from "@webiny/api-sync-to-opensearch/features/OperationsBuilder/abstraction.js";
import { OperationType } from "@webiny/api-sync-to-opensearch/features/Operations/Operations.js";
import type { Operations } from "@webiny/api-sync-to-opensearch/features/Operations/abstractions/Operations.js";
import { OperationsFactory } from "@webiny/api-sync-to-opensearch/features/Operations/abstractions/OperationsFactory.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import type { PgWalChangeRecord } from "~/types.js";

class PgOperationsBuilderImpl implements OperationsBuilder.Interface<PgWalChangeRecord> {
    public constructor(
        private readonly compressor: CompressionHandler.Interface,
        private readonly operationsFactory: OperationsFactory.Interface
    ) {}

    public async build(params: { records: PgWalChangeRecord[] }): Promise<Operations.Interface> {
        const operations = this.operationsFactory.create();
        for (const record of params.records) {
            if (!record.id || !record.index) {
                console.error(`Missing id or index in sync record, skipping.`);
                continue;
            }

            if (
                record.operation === OperationType.INSERT ||
                record.operation === OperationType.MODIFY
            ) {
                if (!record.data) {
                    console.error(
                        `Missing data for ${record.operation} operation, ID ${record.id}. Skipping.`
                    );
                    continue;
                }
                const data = await this.compressor.decompress({
                    compression: "jsonpack",
                    value: record.data
                });
                if (data === undefined || data === null) {
                    console.error(
                        `Could not decompress data for operation "${record.operation}", ID ${record.id}. Skipping.`
                    );
                    continue;
                }

                operations.insert({
                    id: record.id,
                    index: record.index,
                    data
                });
            } else if (record.operation === OperationType.REMOVE) {
                operations.delete({
                    id: record.id,
                    index: record.index
                });
            }
        }
        return operations;
    }
}

export const PgOperationsBuilder = OperationsBuilder.createImplementation({
    implementation: PgOperationsBuilderImpl,
    dependencies: [CompressionHandler, OperationsFactory]
});
