import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { TaskResultStatus } from "@webiny/api-core/features/task/TaskDefinition/abstractions.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { StorageScanner } from "~/abstractions/StorageScanner.js";
import { StorageWriter } from "~/abstractions/StorageWriter.js";
import { ReindexRunner } from "~/tasks/reindex/abstractions/ReindexRunner.js";
import { ReindexRunner as ReindexRunnerImpl } from "~/tasks/reindex/ReindexRunner.js";
import { createMockController } from "~tests/mocks/createMockController";
import { createMockIndexManager } from "~tests/mocks/createMockIndexManager";
import { createMockStorageScanner } from "~tests/mocks/createMockStorageScanner";
import { createMockStorageWriter } from "~tests/mocks/createMockStorageWriter";
import type {
    IReindexRunner,
    IIndexConfigsMap
} from "~/tasks/reindex/abstractions/ReindexRunner.js";
import type { IStorageScannerRecord } from "~/abstractions/StorageScanner.js";

const createRecord = (index: string, entity: string, id: string): IStorageScannerRecord => ({
    index,
    entity,
    data: { PK: `T#root#${id}`, SK: id, index, entity, data: { id } },
    modified: "2026-01-01T00:00:00.000Z"
});

const buildRunner = (params: {
    scanner: ReturnType<typeof createMockStorageScanner>;
    writer: ReturnType<typeof createMockStorageWriter>;
    controller: ReturnType<typeof createMockController>;
}): IReindexRunner => {
    const container = new Container();
    container.registerInstance(TaskController, params.controller.controller);
    container.registerInstance(StorageScanner, params.scanner.scanner);
    container.registerInstance(StorageWriter, params.writer.writer);
    container.register(ReindexRunnerImpl);
    return container.resolve(ReindexRunner);
};

const emptyConfigs: IIndexConfigsMap = {};

describe("ReindexRunner", () => {
    it("should complete immediately when no items to scan", async () => {
        const scanner = createMockStorageScanner([]);
        const writer = createMockStorageWriter();
        const controller = createMockController();
        const { manager } = createMockIndexManager();

        const runner = buildRunner({ scanner, writer, controller });
        const result = await runner.execute(undefined, 100, manager, emptyConfigs);

        expect(result.status).toBe(TaskResultStatus.DONE);
        expect(writer.written).toHaveLength(0);
    });

    it("should process records across multiple indexes", async () => {
        const records = [
            createRecord("products-root", "ProductEntry", "p1"),
            createRecord("products-root", "ProductSearchEntry", "p1-search"),
            createRecord("orders-root", "OrderEntry", "o1"),
            createRecord("categories-root", "CategoryEntry", "c1")
        ];

        const scanner = createMockStorageScanner([{ items: records }]);
        const writer = createMockStorageWriter();
        const controller = createMockController();
        const { manager, disabled } = createMockIndexManager({
            existingIndexes: ["products-root", "orders-root", "categories-root"]
        });

        const runner = buildRunner({ scanner, writer, controller });
        const result = await runner.execute(undefined, 100, manager, emptyConfigs);

        expect(result.status).toBe(TaskResultStatus.DONE);
        expect(writer.written).toHaveLength(4);
        expect(writer.getExecuteCount()).toBe(1);

        const writtenEntities = writer.written.map(r => r.entity);
        expect(writtenEntities).toContain("ProductEntry");
        expect(writtenEntities).toContain("ProductSearchEntry");
        expect(writtenEntities).toContain("OrderEntry");
        expect(writtenEntities).toContain("CategoryEntry");

        expect(manager.settings["products-root"]).toBeDefined();
        expect(manager.settings["orders-root"]).toBeDefined();
        expect(manager.settings["categories-root"]).toBeDefined();
    });

    it("should create missing index when config is available", async () => {
        const records = [createRecord("products-root", "ProductEntry", "p1")];

        const scanner = createMockStorageScanner([{ items: records }]);
        const writer = createMockStorageWriter();
        const controller = createMockController();
        const { manager, created } = createMockIndexManager({ existingIndexes: [] });

        const indexConfigs: IIndexConfigsMap = {
            "products-root": {
                index: "products-root",
                settings: { mappings: { properties: { id: { type: "keyword" } } } }
            }
        };

        const runner = buildRunner({ scanner, writer, controller });
        const result = await runner.execute(undefined, 100, manager, indexConfigs);

        expect(result.status).toBe(TaskResultStatus.DONE);
        expect(created).toHaveLength(1);
        expect(created[0].index).toBe("products-root");
        expect(created[0].settings).toEqual({
            mappings: { properties: { id: { type: "keyword" } } }
        });
        expect(writer.written).toHaveLength(1);
    });

    it("should skip record when index missing and no config available", async () => {
        const records = [createRecord("unknown-index", "SomeEntry", "u1")];

        const scanner = createMockStorageScanner([{ items: records }]);
        const writer = createMockStorageWriter();
        const controller = createMockController();
        const { manager } = createMockIndexManager({ existingIndexes: [] });

        const runner = buildRunner({ scanner, writer, controller });
        const result = await runner.execute(undefined, 100, manager, emptyConfigs);

        expect(result.status).toBe(TaskResultStatus.DONE);
        expect(writer.written).toHaveLength(0);
        expect(controller.logs).toHaveLength(1);
        expect(controller.logs[0].message).toContain("no configuration found");
    });

    it("should filter records by matching input", async () => {
        const records = [
            createRecord("products-root", "ProductEntry", "p1"),
            createRecord("orders-root", "OrderEntry", "o1")
        ];

        const scanner = createMockStorageScanner([{ items: records }]);
        const writer = createMockStorageWriter();
        const controller = createMockController({ input: { matching: "products" } });
        const { manager } = createMockIndexManager({
            existingIndexes: ["products-root", "orders-root"]
        });

        const runner = buildRunner({ scanner, writer, controller });
        const result = await runner.execute(undefined, 100, manager, emptyConfigs);

        expect(result.status).toBe(TaskResultStatus.DONE);
        expect(writer.written).toHaveLength(1);
        expect(writer.written[0].entity).toBe("ProductEntry");
    });

    it("should handle published and latest records in same index", async () => {
        const records = [
            createRecord("products-root", "ProductEntry", "p1-latest"),
            createRecord("products-root", "ProductSearchEntry", "p1-published")
        ];

        const scanner = createMockStorageScanner([{ items: records }]);
        const writer = createMockStorageWriter();
        const controller = createMockController();
        const { manager } = createMockIndexManager({ existingIndexes: ["products-root"] });

        const runner = buildRunner({ scanner, writer, controller });
        const result = await runner.execute(undefined, 100, manager, emptyConfigs);

        expect(result.status).toBe(TaskResultStatus.DONE);
        expect(writer.written).toHaveLength(2);

        const entities = writer.written.map(r => r.entity);
        expect(entities).toContain("ProductEntry");
        expect(entities).toContain("ProductSearchEntry");
    });

    it("should return continue with cursor when close to timeout", async () => {
        let scanCount = 0;
        const records = [createRecord("products-root", "ProductEntry", "p1")];

        const scanner = createMockStorageScanner([{ items: records, cursor: "next-page-cursor" }]);
        const writer = createMockStorageWriter();
        const controller = createMockController({
            isCloseToTimeout: () => {
                scanCount++;
                return scanCount > 1;
            }
        });
        const { manager } = createMockIndexManager({ existingIndexes: ["products-root"] });

        const runner = buildRunner({ scanner, writer, controller });
        const result = await runner.execute(undefined, 100, manager, emptyConfigs);

        expect(result.status).toBe(TaskResultStatus.CONTINUE);
        expect((result as any).input.cursor).toBe("next-page-cursor");
        expect(writer.written).toHaveLength(1);
    });

    it("should overwrite records via writer.put, not create new indexes", async () => {
        const records = [
            createRecord("products-root", "ProductEntry", "p1"),
            createRecord("products-root", "ProductEntry", "p2")
        ];

        const scanner = createMockStorageScanner([{ items: records }]);
        const writer = createMockStorageWriter();
        const controller = createMockController();
        const { manager, created } = createMockIndexManager({
            existingIndexes: ["products-root"]
        });

        const runner = buildRunner({ scanner, writer, controller });
        const result = await runner.execute(undefined, 100, manager, emptyConfigs);

        expect(result.status).toBe(TaskResultStatus.DONE);
        expect(created).toHaveLength(0);
        expect(writer.written).toHaveLength(2);

        for (const record of writer.written) {
            expect(record.data.modified).toBeDefined();
            expect(new Date(record.data.modified).getTime()).toBeGreaterThan(0);
        }
    });

    it("should skip records without entity", async () => {
        const record = createRecord("products-root", "", "p1");

        const scanner = createMockStorageScanner([{ items: [record] }]);
        const writer = createMockStorageWriter();
        const controller = createMockController();
        const { manager } = createMockIndexManager({ existingIndexes: ["products-root"] });

        const runner = buildRunner({ scanner, writer, controller });
        const result = await runner.execute(undefined, 100, manager, emptyConfigs);

        expect(result.status).toBe(TaskResultStatus.DONE);
        expect(writer.written).toHaveLength(0);
    });
});
