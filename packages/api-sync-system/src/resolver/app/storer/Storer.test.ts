import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { createStorer, Storer } from "~/resolver/app/storer/Storer.js";
import { createRegularMockTable } from "~tests/mocks/table.js";
import { createMockTargetDeployment } from "~tests/mocks/deployments.js";
import { createMockTableItemData } from "~tests/mocks/tableItem.js";
import { ScanCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";

const item1 = createMockTableItemData({
    order: 1,
    size: "extreme"
});
const item2 = createMockTableItemData({
    order: 2,
    size: "extreme"
});
const item3 = createMockTableItemData({
    order: 3,
    size: "extreme"
});

describe("Storer", () => {
    const client = getDocumentClient();

    const table = createRegularMockTable();
    const deployment = createMockTargetDeployment();

    it("should create a new Storer instance", () => {
        const storer = createStorer({
            createDocumentClient: () => {
                return client;
            }
        });

        expect(storer).toBeInstanceOf(Storer);
    });

    it("should store items in batches", async () => {
        const storer = createStorer({
            maxBatchSize: 5,
            createDocumentClient: () => {
                return client;
            }
        });

        await storer.store({
            command: "put",
            items: [item1, item2, item3],
            table,
            deployment
        });

        const scanned = await client.send(
            new ScanCommand({
                TableName: table.name,
                Limit: 1000
            })
        );

        expect(scanned.Items).toHaveLength(3);
        expect(scanned.Items).toEqual(
            expect.arrayContaining([
                expect.objectContaining(item1),
                expect.objectContaining(item2),
                expect.objectContaining(item3)
            ])
        );
    });

    it("should throw an error if the command is not supported", async () => {
        const storer = createStorer({
            createDocumentClient: () => {
                return client;
            }
        });

        console.error = jest.fn();

        const command = "unsupported";

        await storer.store({
            // @ts-expect-error
            command,
            items: [item1],
            table,
            deployment
        });

        expect(console.error).toHaveBeenCalledWith(`Error getting request type: ${command}.`);
    });
});
