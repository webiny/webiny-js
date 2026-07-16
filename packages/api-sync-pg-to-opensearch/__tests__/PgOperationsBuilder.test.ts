import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/feature/api";
import { OperationsBuilder } from "@webiny/api-sync-to-opensearch/features/OperationsBuilder/abstraction.js";
import { OperationsFactoryFeature } from "@webiny/api-sync-to-opensearch/features/Operations/feature.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { createJsonpackCompression } from "@webiny/utils/features/compression/legacy/index.js";
import { PgOperationsBuilderFeature } from "~/features/PgOperationsBuilder/feature";
import type { PgWalChangeRecord } from "~/types";

// The PG sync table stores only the compressed value string (no self-describing
// compression envelope), so fixtures here are compressed with the same "jsonpack"
// algorithm PgOperationsBuilder assumes when it calls `compressor.decompress()`.
const jsonpack = createJsonpackCompression();

describe("PgOperationsBuilder", () => {
    let builder: OperationsBuilder.Interface;

    beforeEach(() => {
        const container = new Container();
        CompressionFeature.register(container);
        OperationsFactoryFeature.register(container);
        PgOperationsBuilderFeature.register(container);
        builder = container.resolve(OperationsBuilder);
    });

    const createRecord = async (
        overrides: Partial<PgWalChangeRecord> & { rawData?: Record<string, unknown> }
    ): Promise<PgWalChangeRecord> => {
        const { rawData, ...rest } = overrides;
        let data = rest.data ?? "";
        if (rawData) {
            const compressed = await jsonpack.compress(rawData);
            data = compressed.value;
        }
        return {
            id: "entry-1:L",
            entryId: "entry-1",
            index: "test-index",
            operation: "INSERT",
            data,
            tenant: "root",
            ...rest
        };
    };

    it("should build an insert operation", async () => {
        const record = await createRecord({
            rawData: { id: "123", title: "Test" }
        });
        const operations = await builder.build({ records: [record] });
        expect(operations.total).toBe(2);
        expect(operations.items).toEqual([
            { index: { _id: "entry-1:L", _index: "test-index" } },
            { id: "123", title: "Test" }
        ]);
    });

    it("should build a delete operation", async () => {
        const record = await createRecord({
            operation: "REMOVE",
            data: ""
        });
        const operations = await builder.build({ records: [record] });
        expect(operations.total).toBe(1);
        expect(operations.items).toEqual([{ delete: { _id: "entry-1:L", _index: "test-index" } }]);
    });

    it("should skip record if missing id", async () => {
        const record = await createRecord({ id: "", rawData: { title: "Test" } });
        const operations = await builder.build({ records: [record] });
        expect(operations.total).toBe(0);
    });

    it("should skip record if missing index", async () => {
        const record = await createRecord({ index: "", rawData: { title: "Test" } });
        const operations = await builder.build({ records: [record] });
        expect(operations.total).toBe(0);
    });

    it("should skip INSERT record if missing data", async () => {
        const record = await createRecord({ data: "" });
        const operations = await builder.build({ records: [record] });
        expect(operations.total).toBe(0);
    });

    it("should handle mixed operations", async () => {
        const insert = await createRecord({
            id: "entry-1:L",
            rawData: { id: "1", title: "Insert" }
        });
        const remove = await createRecord({
            id: "entry-2:P",
            index: "test-index-2",
            operation: "REMOVE"
        });
        const operations = await builder.build({ records: [insert, remove] });
        expect(operations.count).toBe(2);
    });
});
