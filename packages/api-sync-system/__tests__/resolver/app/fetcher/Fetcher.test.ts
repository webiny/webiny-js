import { createFetcher } from "~/resolver/app/fetcher/Fetcher.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { createMockSourceDeployment } from "~tests/mocks/deployments.js";
import { createRegularMockTable } from "~tests/mocks/table.js";
import { SourceDataContainer } from "~/resolver/app/data/SourceDataContainer.js";
import { createMockTableItemData, storeMockTableItems } from "~tests/mocks/tableItem.js";

const item1 = createMockTableItemData({
    order: 1
});
const item2 = createMockTableItemData({
    order: 2
});
const item3 = createMockTableItemData({
    order: 3
});
const item4 = createMockTableItemData({
    order: 4
});
const item5 = createMockTableItemData({
    order: 5
});
const item6 = createMockTableItemData({
    order: 6
});
const item7 = createMockTableItemData({
    order: 7
});

describe("Fetcher", () => {
    const table = createRegularMockTable();
    const client = getDocumentClient();

    it("should initialize the fetcher and execute with empty input and result", async () => {
        const fetcher = createFetcher({
            maxRetries: 1,
            retryDelay: 100,
            createDocumentClient() {
                return client;
            }
        });

        const result = await fetcher.exec({
            maxBatchSize: 1,
            deployment: createMockSourceDeployment(),
            table: createRegularMockTable(),
            items: []
        });

        expect(result).toEqual({
            items: SourceDataContainer.create()
        });
    });

    it("should fetch some items", async () => {
        const fetcher = createFetcher({
            createDocumentClient() {
                return client;
            }
        });

        await storeMockTableItems({
            client,
            table,
            items: [item1, item2, item3, item4]
        });

        const result = await fetcher.exec({
            maxBatchSize: 1,
            deployment: createMockSourceDeployment(),
            table: createRegularMockTable(),
            items: [item1, item2, item3, item4, item5, item6, item7]
        });
        const items = Object.values(result.items?.items || {});

        expect(items).toHaveLength(7);

        expect(items[0].data).toEqual(item1);
        expect(items[1].data).toEqual(item2);
        expect(items[2].data).toEqual(item3);
        expect(items[3].data).toEqual(item4);
        expect(items[4].data).toEqual(null);
        expect(items[5].data).toEqual(null);
        expect(items[6].data).toEqual(null);
    });

    it("should fail on retries", async () => {
        const message = `Test failure.`;
        const fetcher = createFetcher({
            maxRetries: 1,
            retryDelay: 100,
            createDocumentClient() {
                return {
                    send: async () => {
                        throw new Error(message);
                    }
                };
            }
        });

        await storeMockTableItems({
            client,
            table,
            items: [item1]
        });

        await expect(async () => {
            return await fetcher.exec({
                deployment: createMockSourceDeployment(),
                table: createRegularMockTable(),
                items: [item1, item2, item3, item4]
            });
        }).rejects.toThrow(message);
    });
});
