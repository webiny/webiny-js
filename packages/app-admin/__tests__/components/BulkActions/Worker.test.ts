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

    describe("when an item's callback throws", () => {
        const succeedUnless =
            (shouldThrow: (item: Item) => unknown) =>
            async ({ item, report }: CallbackParams<Item>): Promise<void> => {
                const error = shouldThrow(item);
                if (error !== undefined) {
                    throw error;
                }
                report.success({ title: item.name });
            };

        it("records the failure under the item's title and processes every other item", async () => {
            const items = createMockItems(20);
            const namedWorker = new Worker<Item>({ getItemTitle: item => `Named ${item.id}` });
            const called = vi.fn();

            await namedWorker.processInSeries(
                items,
                async params => {
                    called(params.item.id);
                    return succeedUnless(item => (item.id === 2 ? new Error("Boom") : undefined))(
                        params
                    );
                },
                5
            );

            expect(called).toHaveBeenCalledTimes(20);
            expect(namedWorker.results.length).toBe(20);

            const failures = namedWorker.results.filter(r => r.status === "failure");
            expect(failures).toEqual([{ title: "Named 2", message: "Boom", status: "failure" }]);
        });

        it("keeps going after failures in two different chunks", async () => {
            const items = createMockItems(20);
            const called = vi.fn();

            await worker.processInSeries(
                items,
                async params => {
                    called(params.item.id);
                    return succeedUnless(item =>
                        item.id === 1 || item.id === 12 ? new Error(`Failed ${item.id}`) : undefined
                    )(params);
                },
                5
            );

            expect(called).toHaveBeenCalledTimes(20);
            expect(worker.results.length).toBe(20);

            const failures = worker.results.filter(r => r.status === "failure");
            expect(failures.map(f => f.message).sort()).toEqual(["Failed 1", "Failed 12"]);

            // The rest of each failing chunk still ran.
            const successes = worker.results.filter(r => r.status === "success");
            expect(successes.map(s => s.title)).toEqual(
                expect.arrayContaining(["Item 0", "Item 2", "Item 3", "Item 4", "Item 13"])
            );
        });

        it("falls back to the item's title, then name, then id, then its position", async () => {
            const anyWorker = new Worker<Record<string, unknown>>();
            const items = [
                { title: "A title", name: "A name", id: "a" },
                { title: "", name: "B name", id: "b" },
                { id: 7 },
                { other: true }
            ];

            await anyWorker.processInSeries(items, async () => {
                throw new Error("Boom");
            });

            expect(anyWorker.results.map(r => r.title)).toEqual([
                "A title",
                "B name",
                "7",
                "Item 4"
            ]);
        });

        it("falls back when the namer throws or returns nothing", async () => {
            const items = createMockItems(2);
            const brokenWorker = new Worker<Item>({
                getItemTitle: item => {
                    if (item.id === 0) {
                        throw new Error("Namer broke");
                    }
                    return "";
                }
            });

            await brokenWorker.processInSeries(items, async () => {
                throw new Error("Boom");
            });

            expect(brokenWorker.results).toEqual([
                { title: "Item 0", message: "Boom", status: "failure" },
                { title: "Item 1", message: "Boom", status: "failure" }
            ]);
        });

        it("gives a readable message for thrown non-Error values", async () => {
            const items = createMockItems(4);
            const thrown: unknown[] = ["Plain string", { code: "NO_MESSAGE" }, null, 42];

            await worker.processInSeries(items, async ({ item }) => {
                throw thrown[item.id];
            });

            expect(worker.results.map(r => r.message)).toEqual([
                "Plain string",
                "Unknown error",
                "Unknown error",
                "42"
            ]);
        });
    });
});
