import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import { DeleteModelGateway as GatewayAbstraction } from "./abstractions.js";
import { DeleteModelGateway } from "./DeleteModelGateway.js";

const blockedData = {
    modelId: "article",
    workflows: [{ id: "wf1", name: "Article review" }]
};

function setup() {
    const client = { execute: vi.fn() };
    const container = new Container();
    container.registerInstance(CmsGraphQLClient, client);
    container.register(DeleteModelGateway).inSingletonScope();
    const gateway = container.resolve(GatewayAbstraction);
    return { client, gateway };
}

describe("DeleteModelGateway", () => {
    it("returns the result and sends the model id and the confirmation", async () => {
        const { client, gateway } = setup();
        const result = { id: "task-1", status: "pending", deleted: 0, total: 3 };
        client.execute.mockResolvedValue({ fullyDeleteModel: { data: result, error: null } });

        expect(await gateway.execute("article", "delete article")).toEqual(result);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ modelId: "article", confirmation: "delete article" });
    });

    it("throws a GraphQLOperationError carrying the code, data and message of the envelope error", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            fullyDeleteModel: {
                data: null,
                error: {
                    message: "The model is used by a workflow.",
                    code: "Workflows/Model/BoundToWorkflow",
                    data: blockedData
                }
            }
        });

        const error = await gateway.execute("article", "delete article").catch(ex => ex);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("The model is used by a workflow.");
        expect(error.code).toBe("Workflows/Model/BoundToWorkflow");
        expect(error.data).toEqual(blockedData);
    });
});
