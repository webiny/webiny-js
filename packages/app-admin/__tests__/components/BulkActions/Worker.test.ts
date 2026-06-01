import { describe, it, expect, beforeEach, vi } from "vitest";
import { CallbackParams, Worker } from "~/components/BulkActions/Worker";

interface Item {
    id: number;
    name: string;
}

const createMockItems = (count = 10): Item[] =>
    Array.from({ length: count }, (_, index) => ({
        id: index,
        name: `Item ${index}`
    }));

describe("Worker", () => {
    let worker: Worker<Item>;

    beforeEach(() => {
        worker = new Worker<Item>();
    });

    it("should process items using the provided callback", () => {
        const items = createMockItems();
        const mockCallback = vi.fn();

        worker.process(items, mockCallback);

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(items);
    });

    it("should process items in series with the given chunk size", async () => {
        const items = createMockItems(20);
        const chunkSize = 5;

        const callbackFn = vi.fn();

        const mockCallback = async ({
            item,
            allItems,
            report
        }: CallbackParams<Item>): Promise<void> => {
            await callbackFn(item, allItems);

            if (item.id % 2 === 0) {
                report.error({
                    title: `Errored item ${item}`
                });
                return;
            }

            report.success({
                title: `Processed item ${item}`
            });
            return;
        };

        await worker.processInSeries(items, mockCallback, chunkSize);

        expect(callbackFn).toHaveBeenCalledTimes(items.length);

        for (let i = 0; i < items.length; i++) {
            expect(callbackFn).toHaveBeenCalledWith(items[i], items);
        }

        expect(worker.results.length).toBe(items.length);
        const successResults = worker.results.filter(result => result.status === "success");
        const failureResults = worker.results.filter(result => result.status === "failure");

        expect(successResults.length).toBe(items.length / 2);
        expect(failureResults.length).toBe(items.length / 2);
    });
});
