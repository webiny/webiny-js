import { setupGroupAndModels } from "~tests/testHelpers/setup";
import { useCategoryManageHandlerV2 } from "~tests/testHelpers/useCategoryManageHandler";
import { SecurityIdentity } from "@webiny/api-security/types";

const identityA: SecurityIdentity = { id: "a", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "b", type: "admin", displayName: "B" };

describe("Content entries - Entry Meta Fields Overrides", () => {
    const managerIdentityA = useCategoryManageHandlerV2({
        path: "manage/en-US",
        identity: identityA
    });

    beforeEach(async () => {
        await setupGroupAndModels({
            manager: managerIdentityA,
            models: ["category"]
        });
    });

    test("users should be able to create and immediately publish an entry with a custom publishing-related values", async () => {
        // 1. Initially, all meta fields should be populated, except the "modified" ones.
        const testDate = new Date("2020-01-01T00:00:00.000Z").toISOString();

        const { data: rev } = await managerIdentityA.createCategory({
            data: {
                title: "Fruits",
                slug: "fruits",
                meta: {
                    status: "published",
                    revisionFirstPublishedOn: testDate,
                    revisionLastPublishedOn: testDate,
                    revisionFirstPublishedBy: identityB,
                    revisionLastPublishedBy: identityB,
                    entryFirstPublishedOn: testDate,
                    entryLastPublishedOn: testDate,
                    entryFirstPublishedBy: identityB,
                    entryLastPublishedBy: identityB
                }
            }
        });

        expect(rev).toMatchObject({
            createdOn: expect.toBeDateString(),
            createdBy: identityA,
            modifiedBy: null,
            ownedBy: identityA,
            savedOn: expect.toBeDateString(),
            meta: {
                revisionFirstPublishedOn: testDate,
                revisionLastPublishedOn: testDate,
                revisionFirstPublishedBy: identityB,
                revisionLastPublishedBy: identityB,
                entryFirstPublishedOn: testDate,
                entryLastPublishedOn: testDate,
                entryFirstPublishedBy: identityB,
                entryLastPublishedBy: identityB
            }

        });
    });
});
