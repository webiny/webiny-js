import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsModel } from "~/types.js";
import { PermanentlyDeleteEntryGateway as GatewayAbstraction } from "./abstractions.js";
import { PermanentlyDeleteEntryGateway } from "./PermanentlyDeleteEntryGateway.js";

const model = { modelId: "article", singularApiName: "Article" } as CmsModel;

const blockedData = {
    model: "cms.article",
    action: "delete",
    reviews: [
        {
            reviewId: "review-1",
            model: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            title: "Launch article",
            stepPosition: 1,
            stepCount: 1,
            stepName: "Editor"
        }
    ]
};

function setup() {
    const client = { execute: vi.fn() };
    const container = new Container();
    container.registerInstance(CmsGraphQLClient, client);
    container.register(PermanentlyDeleteEntryGateway).inSingletonScope();
    const gateway = container.resolve(GatewayAbstraction);
    return { client, gateway };
}

describe("PermanentlyDeleteEntryGateway", () => {
    it("returns true and sends permanently: true", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({ content: { data: true, error: null } });

        const result = await gateway.execute({ model, id: "entry-1" });

        expect(result).toBe(true);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ revision: "entry-1", permanently: true });
        expect(request.query).toContain("error { message code data }");
    });

    it("throws a GraphQLOperationError carrying the code, data and message when data is falsy", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            content: {
                data: null,
                error: {
                    message:
                        "This content has a review in progress. Deleting it cancels the review.",
                    code: "Workflows/Review/ActiveReviewOnTrash",
                    data: blockedData
                }
            }
        });

        const error = await gateway.execute({ model, id: "entry-1" }).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe(
            "This content has a review in progress. Deleting it cancels the review."
        );
        expect(error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(error.data).toEqual(blockedData);
    });

    it("keeps its condition: a falsy data with no error throws the fallback with a null code and data", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({ content: { data: false, error: null } });

        const error = await gateway.execute({ model, id: "entry-1" }).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Could not permanently delete the entry.");
        expect(error.code).toBeNull();
        expect(error.data).toBeNull();
    });

    it("falls back to the existing message when the server sends an empty one", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            content: { data: null, error: { message: "", code: "Some/Code", data: null } }
        });

        const error = await gateway.execute({ model, id: "entry-1" }).catch(e => e);

        expect(error.message).toBe("Could not permanently delete the entry.");
        expect(error.code).toBe("Some/Code");
    });

    it("lets a transport failure pass through unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockRejectedValue(new Error("Network down"));

        const error = await gateway.execute({ model, id: "entry-1" }).catch(e => e);

        expect(error).not.toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Network down");
    });
});
