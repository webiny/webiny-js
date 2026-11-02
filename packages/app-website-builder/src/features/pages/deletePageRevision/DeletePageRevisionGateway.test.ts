import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { DeletePageRevisionGateway as GatewayAbstraction } from "./abstractions.js";
import { DeletePageRevisionGateway } from "./DeletePageRevisionGateway.js";

const blockedData = {
    model: "wb.page",
    action: "delete",
    reviews: [
        {
            reviewId: "review-1",
            model: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0002",
            title: "Home page",
            stepPosition: 2,
            stepCount: 2,
            stepName: "Legal"
        }
    ]
};

function setup() {
    const client = { execute: vi.fn() };
    const container = new Container();
    container.registerInstance(MainGraphQLClient, client);
    container.register(DeletePageRevisionGateway).inSingletonScope();
    const gateway = container.resolve(GatewayAbstraction);
    return { client, gateway };
}

describe("DeletePageRevisionGateway", () => {
    it("resolves and sends only the revision id (no undeclared permanently variable)", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            websiteBuilder: { deletePageRevision: { data: true, error: null } }
        });

        await expect(gateway.execute("page-1#0002")).resolves.toBeUndefined();

        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ id: "page-1#0002" });
        expect(request.query).toContain("deletePageRevision(id: $id)");
    });

    it("throws a GraphQLOperationError carrying the code, data and message of the envelope error", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            websiteBuilder: {
                deletePageRevision: {
                    data: null,
                    error: {
                        message:
                            "This content has a review in progress. Deleting it cancels the review.",
                        code: "Workflows/Review/ActiveReviewOnTrash",
                        data: blockedData
                    }
                }
            }
        });

        const error = await gateway.execute("page-1#0002").catch(e => e);

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
            websiteBuilder: {
                deletePageRevision: {
                    data: null,
                    error: { message: "", code: "Some/Code", data: null }
                }
            }
        });

        const error = await gateway.execute("page-1#0002").catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Could not delete page revision.");
    });

    it("lets a transport failure pass through unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockRejectedValue(new Error("Network down"));

        const error = await gateway.execute("page-1#0002").catch(e => e);

        expect(error).not.toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Network down");
    });
});
