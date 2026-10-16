import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsModel } from "~/types.js";
import { DeleteEntryRevisionGateway as GatewayAbstraction } from "./abstractions.js";
import { DeleteEntryRevisionGateway } from "./DeleteEntryRevisionGateway.js";

const model = { modelId: "article", singularApiName: "Article" } as CmsModel;

const blockedData = {
    model: "cms.article",
    action: "delete",
    reviews: [
        {
            reviewId: "review-1",
            model: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0002",
            title: "Launch article",
            stepPosition: 1,
            stepCount: 2,
            stepName: "Editor"
        }
    ]
};

function setup() {
    const client = { execute: vi.fn() };
    const container = new Container();
    container.registerInstance(CmsGraphQLClient, client);
    container.register(DeleteEntryRevisionGateway).inSingletonScope();
    const gateway = container.resolve(GatewayAbstraction);
    return { client, gateway };
}

describe("DeleteEntryRevisionGateway", () => {
    it("returns true and sends only the revision id", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({ content: { data: true, error: null } });

        const result = await gateway.execute({ model, revisionId: "entry-1#0002" });

        expect(result).toBe(true);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ revision: "entry-1#0002" });
        expect(request.query).toContain("error { message code data }");
    });

    it("throws a GraphQLOperationError carrying the code, data and message of the envelope error", async () => {
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

        const error = await gateway.execute({ model, revisionId: "entry-1#0002" }).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe(
            "This content has a review in progress. Deleting it cancels the review."
        );
        expect(error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(error.data).toEqual(blockedData);
    });

    it("falls back to the existing message when the server sends none", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            content: { data: null, error: { message: "", code: "Some/Code", data: null } }
        });

        const error = await gateway.execute({ model, revisionId: "entry-1#0002" }).catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Could not delete entry revision");
    });

    it("lets a transport failure pass through unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockRejectedValue(new Error("Network down"));

        const error = await gateway.execute({ model, revisionId: "entry-1#0002" }).catch(e => e);

        expect(error).not.toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Network down");
    });
});
