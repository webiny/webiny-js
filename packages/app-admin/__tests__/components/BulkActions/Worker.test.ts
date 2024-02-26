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

    it("should set and get items", () => {
        const items = createMockItems();
        worker.items = items;

        expect(worker.items).toEqual(items);
    });

    it("should process items using the provided callback", () => {
        const items = createMockItems();
        const mockCallback = jest.fn();
        worker.items = items;

        worker.process(mockCallback);

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(items);
    });

    it('"should process items in series with the given chunk size', async () => {
        const items = createMockItems(20);
        const chunkSize = 5;
        worker.items = items;

        const callbackFn = jest.fn();

        const mockCallback = async ({
            item,
            allItems,
            report
        }: CallbackParams<Item>): Promise<void> => {
            await callbackFn(item, allItems);

            // Report error for items with even id
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

        await worker.processInSeries(mockCallback, chunkSize);

        // Check that fn was called for each item
        expect(callbackFn).toHaveBeenCalledTimes(items.length);

        // Check that fn was called with the correct items
        for (let i = 0; i < items.length; i++) {
            expect(callbackFn).toHaveBeenCalledWith(items[i], items);
        }

        // Check the number of success and failure results
        expect(worker.results.length).toBe(items.length);
        const successResults = worker.results.filter(result => result.status === "success");
        const failureResults = worker.results.filter(result => result.status === "failure");

        expect(successResults.length).toBe(items.length / 2);
        expect(failureResults.length).toBe(items.length / 2);
    });
});
