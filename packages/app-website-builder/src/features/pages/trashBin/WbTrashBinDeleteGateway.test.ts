import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { TrashBinDeleteGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { WbTrashBinDeleteGateway } from "./WbTrashBinDeleteGateway.js";

const blockedData = {
    model: "wb.page",
    action: "delete",
    reviews: [
        {
            reviewId: "review-1",
            model: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0001",
            title: "Home page",
            stepPosition: 1,
            stepCount: 1,
            stepName: "Editor"
        }
    ]
};

function setup() {
    const client = { execute: vi.fn() };
    const container = new Container();
    container.registerInstance(MainGraphQLClient, client);
    container.register(WbTrashBinDeleteGateway).inSingletonScope();
    const gateway = container.resolve(TrashBinDeleteGateway);
    return { client, gateway };
}

describe("WbTrashBinDeleteGateway", () => {
    it("returns true, sends permanently: true and selects the error data", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            websiteBuilder: { deletePage: { data: true, error: null } }
        });

        const result = await gateway.execute("page-1#0001");

        expect(result).toBe(true);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ id: "page-1#0001", permanently: true });
        expect(request.query).toMatch(/error\s*\{\s*code\s*message\s*data\s*\}/);
    });

    it("throws a GraphQLOperationError carrying the code, data and message of the envelope error", async () => {
        const { client, gateway } = setup();
        client.execute.mockResolvedValue({
            websiteBuilder: {
                deletePage: {
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

        const error = await gateway.execute("page-1#0001").catch(e => e);

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
                deletePage: { data: null, error: { code: "Some/Code", message: "" } }
            }
        });

        const error = await gateway.execute("page-1#0001").catch(e => e);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Could not permanently delete the page.");
        expect(error.code).toBe("Some/Code");
        expect(error.data).toBeNull();
    });

    it("lets a transport failure pass through unchanged", async () => {
        const { client, gateway } = setup();
        client.execute.mockRejectedValue(new Error("Network down"));

        const error = await gateway.execute("page-1#0001").catch(e => e);

        expect(error).not.toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Network down");
    });
});
