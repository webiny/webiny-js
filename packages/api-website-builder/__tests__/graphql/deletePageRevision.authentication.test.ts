import { describe, expect, it, vi } from "vitest";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createPagesSchema } from "~/graphql/pages/pages.gql.js";
import { DeletePageRevisionUseCase } from "~/features/pages/DeletePageRevision/index.js";

/**
 * Pure unit test (no DynamoDB): `deletePageRevision` must stop on the authentication check
 * instead of leaving a floating rejection and continuing to the use case.
 */
describe("deletePageRevision authentication", () => {
    it("should reject an anonymous identity before running the use case", async () => {
        const deletePageRevision = { execute: vi.fn() };
        const context = {
            container: {
                resolve: (abstraction: unknown) => {
                    if (abstraction === IdentityContext) {
                        return { getIdentity: () => ({ isAnonymous: () => true }) };
                    }
                    if (abstraction === DeletePageRevisionUseCase) {
                        return deletePageRevision;
                    }
                    throw new Error(`Unexpected dependency: ${String(abstraction)}`);
                }
            }
        };

        const resolvers = createPagesSchema().schema.resolvers as any;
        const response = await resolvers.WbMutation.deletePageRevision(
            {},
            { id: "page#0001" },
            context
        );

        expect(response.data).toBeNull();
        expect(response.error.code).toBe("NOT_AUTHORIZED");
        expect(deletePageRevision.execute).not.toHaveBeenCalled();
    });
});
