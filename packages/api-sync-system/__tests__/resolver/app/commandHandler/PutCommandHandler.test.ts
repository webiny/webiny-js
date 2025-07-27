import { PutCommandHandler } from "~/resolver/app/commandHandler/PutCommandHandler.js";
import { createMockStorer } from "~tests/mocks/storer.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { createRegularMockTable } from "~tests/mocks/table.js";
import {
    createMockSourceDeployment,
    createMockTargetDeployment
} from "~tests/mocks/deployments.js";
import { createPutCommandHandlerPlugin } from "~/resolver/app/commandHandler/put.js";
import { createCommandBundle } from "~/resolver/app/bundler/CommandBundle.js";

describe("PutCommandHandler", () => {
    const table = createRegularMockTable();
    const targetDeployment = createMockTargetDeployment();
    const sourceDeployment = createMockSourceDeployment();
    const bundle = createCommandBundle({
        command: "put",
        source: sourceDeployment,
        table
    });
    const storer = createMockStorer({
        createDocumentClient: params => {
            return getDocumentClient({
                region: params.region
            });
        }
    });

    it("should create a put command handler plugin", async () => {
        const plugin = createPutCommandHandlerPlugin();

        expect(plugin.canHandle("put")).toBeTrue();
        expect(plugin.canHandle("delete")).toBeFalse();

        const result = await plugin.handle({
            storer,
            targetTable: table,
            items: [],
            targetDeployment,
            bundle
        });

        expect(result).toBeUndefined();
    });

    it("should create a put command handler", async () => {
        const handler = new PutCommandHandler({
            storer
        });

        await handler.handle({
            targetTable: table,
            bundle,
            items: [
                {
                    PK: "T#1",
                    SK: "T#1",
                    values: {
                        someStringValue: "1",
                        someNumberValue: 2
                    }
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
