import { DeleteCommandHandler } from "~/resolver/app/commandHandler/DeleteCommandHandler.js";
import { createMockStorer } from "~tests/mocks/storer.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { createRegularMockTable } from "~tests/mocks/table.js";
import { createMockTargetDeployment } from "~tests/mocks/deployments.js";
import { createDeleteCommandHandlerPlugin } from "~/resolver/app/commandHandler/delete.js";

describe("DeleteCommandHandler", () => {
    const table = createRegularMockTable();
    const targetDeployment = createMockTargetDeployment();
    const storer = createMockStorer({
        createDocumentClient: params => {
            return getDocumentClient({
                region: params.region
            });
        }
    });

    it("should create a delete command handler plugin", async () => {
        const plugin = createDeleteCommandHandlerPlugin();

        expect(plugin.canHandle("delete")).toBeTrue();
        expect(plugin.canHandle("put")).toBeFalse();

        const result = await plugin.handle({
            storer,
            targetTable: table,
            items: [],
            targetDeployment
        });

        expect(result).toBeUndefined();
    });

    it("should create a delete command handler", async () => {
        const handler = new DeleteCommandHandler({
            storer
        });

        await handler.handle({
            targetTable: table,
            items: [
                {
                    PK: "T#1",
                    SK: "T#1"
                },
                {
                    PK: "T#2",
                    SK: ""
                }
            ],
            targetDeployment
        });
    });
});
