import { SyncEventHandler as SyncEventHandlerAbstraction } from "./abstractions.js";
import { SynchronizationBuilder } from "@webiny/api-sync-to-opensearch";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { SyncEvent } from "~/types.js";

const DEFAULT_BATCH_SIZE = 50;

class SyncEventHandlerImpl implements SyncEventHandlerAbstraction.Interface {
    public constructor(
        private readonly synchronizationBuilder: SynchronizationBuilder.Interface,
        private readonly compressionHandler: CompressionHandler.Interface
    ) {}

    public async process(
        events: SyncEvent[],
        options?: SyncEventHandlerAbstraction.ProcessOptions
    ): Promise<void> {
        if (events.length === 0) {
            return;
        }

        const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;

        for (let i = 0; i < events.length; i += batchSize) {
            const batch = events.slice(i, i + batchSize);
            await this.processBatch(batch);
        }
    }

    private async processBatch(events: SyncEvent[]): Promise<void> {
        for (const event of events) {
            if (event.type === "REMOVE") {
                this.synchronizationBuilder.delete({
                    id: event.id,
                    index: event.index
                });
                continue;
            }

            if (!event.data) {
                continue;
            }

            const parsed = JSON.parse(event.data);
            const decompressed = await this.compressionHandler.decompress<GenericRecord>(parsed);

            this.synchronizationBuilder.insert({
                id: event.id,
                index: event.index,
                data: decompressed
            });
        }

        const flush = this.synchronizationBuilder.build();
        await flush();
    }
}

export const SyncEventHandler = SyncEventHandlerAbstraction.createImplementation({
    implementation: SyncEventHandlerImpl,
    dependencies: [SynchronizationBuilder, CompressionHandler]
});
