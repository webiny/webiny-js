import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { TrashBinBulkActionGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { WbTrashBinBulkActionGateway } from "./WbTrashBinBulkActionGateway.js";

function setup() {
    const client = { execute: vi.fn() };
    const container = new Container();
    container.registerInstance(MainGraphQLClient, client);
    container.register(WbTrashBinBulkActionGateway).inSingletonScope();
    const gateway = container.resolve(TrashBinBulkActionGateway);
    return { client, gateway };
}

describe("WbTrashBinBulkActionGateway", () => {
    it("returns the data and sends the action unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            websiteBuilder: { bulkActions: { data: { id: "task-1" }, error: null } }
        });

        const result = await gateway.execute({ action: "Delete", where: { id_in: ["page-1"] } });

        expect(result).toEqual({ id: "task-1" });
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            action: { action: "Delete", where: { id_in: ["page-1"] } }
        });
        expect(request.query).toMatch(/error\s*\{\s*code\s*message\s*data\s*\}/);
    });

    it("throws a GraphQLOperationError carrying the code, data and message when the envelope has an error", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            websiteBuilder: {
                bulkActions: {
                    data: null,
                    error: {
                        message: "Not authorized.",
                        code: "Workflows/NotAuthorized",
                        data: { a: 1 }
                    }
                }
            }
        });

        const error = await gateway.execute({ action: "Delete" }).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Not authorized.");
        expect(error.code).toBe("Workflows/NotAuthorized");
        expect(error.data).toEqual({ a: 1 });
    });

    it("keeps its condition: no data and no error throws the fallback with a null code and data", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            websiteBuilder: { bulkActions: { data: null, error: null } }
        });

        const error = await gateway.execute({ action: "Delete" }).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Could not perform the bulk action.");
        expect(error.code).toBeNull();
        expect(error.data).toBeNull();
    });

    it("lets a transport failure pass through unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockRejectedValue(new Error("Network down"));

        const error = await gateway.execute({ action: "Delete" }).catch(e => e);

        expect(error).not.toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Network down");
    });
});
