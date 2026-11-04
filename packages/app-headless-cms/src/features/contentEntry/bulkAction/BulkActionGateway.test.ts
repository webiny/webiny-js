import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsModel } from "~/types.js";
import { BulkActionGateway as GatewayAbstraction } from "./abstractions.js";
import { BulkActionGateway } from "./BulkActionGateway.js";

const model = { modelId: "article", singularApiName: "Article" } as CmsModel;

function setup() {
    const client = { execute: vi.fn() };
    const container = new Container();
    container.registerInstance(CmsGraphQLClient, client);
    container.register(BulkActionGateway).inSingletonScope();
    const gateway = container.resolve(GatewayAbstraction);
    return { client, gateway };
}

describe("BulkActionGateway", () => {
    it("returns the background task id and sends the action arguments unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({ content: { data: { id: "task-1" }, error: null } });

        const result = await gateway.execute({
            model,
            action: "MoveToTrash",
            where: { id_in: ["entry-1#0001"] }
        });

        expect(result).toEqual({ id: "task-1" });
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            action: "MoveToTrash",
            where: { id_in: ["entry-1#0001"] },
            search: undefined,
            data: undefined
        });
        expect(request.query).toMatch(/error\s*\{\s*message\s*code\s*data\s*\}/);
    });

    it("A72: the response carries only the task id, no per-entry failures", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({ content: { data: { id: "task-1" }, error: null } });

        const result = await gateway.execute({ model, action: "MoveToTrash" });

        expect(Object.keys(result)).toEqual(["id"]);
        const request = client.execute.mock.calls[0][0];
        expect(request.query).toMatch(/data\s*\{\s*id\s*\}/);
    });

    it("throws a GraphQLOperationError carrying the code, data and message when the mutation is refused", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            content: {
                data: null,
                error: {
                    message: "Not authorized.",
                    code: "Workflows/NotAuthorized",
                    data: { reason: "denied" }
                }
            }
        });

        const error = await gateway.execute({ model, action: "MoveToTrash" }).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Not authorized.");
        expect(error.code).toBe("Workflows/NotAuthorized");
        expect(error.data).toEqual({ reason: "denied" });
    });

    it("keeps its condition: no data and no error throws the fallback with a null code and data", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({ content: { data: null, error: null } });

        const error = await gateway.execute({ model, action: "MoveToTrash" }).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Bulk action failed");
        expect(error.code).toBeNull();
        expect(error.data).toBeNull();
    });

    it("lets a transport failure pass through unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockRejectedValue(new Error("Network down"));

        const error = await gateway.execute({ model, action: "MoveToTrash" }).catch(e => e);

        expect(error).not.toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Network down");
    });
});
