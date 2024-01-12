import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { SecurityIdentity } from "@webiny/api-security/types";

const identityA: SecurityIdentity = { id: "a", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "b", type: "admin", displayName: "B" };

describe("Content entries - Entry Meta Fields Overrides", () => {
    const { manage: managerIdentityA } = useTestModelHandler({
        identity: identityA
    });

    beforeEach(async () => {
        await managerIdentityA.setup();
    });

    test("users should be able to create and immediately publish an entry with a custom publishing-related values", async () => {
        // 1. Initially, all meta fields should be populated, except the "modified" ones.
        const testDate = new Date("2020-01-01T00:00:00.000Z").toISOString();

        const { data: rev } = await managerIdentityA.createTestEntry({
            data: {
                status: "published",
                revisionFirstPublishedOn: testDate,
                revisionLastPublishedOn: testDate,
                revisionFirstPublishedBy: identityB,
                revisionLastPublishedBy: identityB,
                firstPublishedOn: testDate,
                lastPublishedOn: testDate,
                firstPublishedBy: identityB,
                lastPublishedBy: identityB
            }
        });

        expect(rev).toMatchObject({
            createdOn: expect.toBeDateString(),
            createdBy: identityA,
            modifiedBy: null,
            savedOn: expect.toBeDateString(),
            revisionFirstPublishedOn: testDate,
            revisionLastPublishedOn: testDate,
            revisionFirstPublishedBy: identityB,
            revisionLastPublishedBy: identityB,
            firstPublishedOn: testDate,
            lastPublishedOn: testDate,
            firstPublishedBy: identityB,
            lastPublishedBy: identityB
        });
    });
});
