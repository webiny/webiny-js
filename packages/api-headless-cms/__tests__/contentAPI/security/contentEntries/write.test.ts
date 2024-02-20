import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { SecurityIdentity } from "@webiny/api-security/types";
import { CmsTestPermissions, expectNotAuthorized } from "../utils";

const identityA: SecurityIdentity = { id: "a", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "b", type: "admin", displayName: "B" };
const identityC: SecurityIdentity = { id: "c", type: "admin", displayName: "C" };

describe("Write Permissions Checks", () => {
    test("should allow creation of entries only with sufficient permission", async () => {
        const { manage: manageApiA } = useTestModelHandler({
            identity: identityA
        });

        await manageApiA.setup();

        const permissions = new CmsTestPermissions({
            groups: { rwd: "rwd" },
            models: { rwd: "rwd" },
            entries: { rwd: "r" }
        });

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: permissions.getPermissions()
        });

        const failedCreateTestEntryResponse = await manageApiB.createTestEntry();

        expectNotAuthorized(failedCreateTestEntryResponse, {
            reason: 'Not allowed to access "testModel" entries.'
        });

        permissions.setPermissions({
            groups: { rwd: "rwd" },
            models: { rwd: "rwd" },
            entries: { rwd: "rw" }
        });

        const { manage: manageApiC } = useTestModelHandler({
            identity: identityC,
            permissions: permissions.getPermissions()
        });

        const createTestEntryResponse = await manageApiC.createTestEntry();

        expect(createTestEntryResponse).toMatchObject({
            data: { createdOn: expect.toBeDateString() },
            error: null
        });
    });

    test("should allow update of groups only with sufficient permission", async () => {
        const { manage: manageApiA } = useTestModelHandler({ identity: identityA });
        await manageApiA.setup();

        const permissions = new CmsTestPermissions({
            groups: { rwd: "rwd" },
            models: { rwd: "rwd" },
            entries: { rwd: "r" }
        });

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: permissions.getPermissions()
        });

        const testEntry = await manageApiA.createTestEntry();

        const failedUpdateTestEntryResponse = await manageApiB.updateTestEntry({
            revision: testEntry.data.id,
            data: { title: "Test - UPDATE" }
        });

        expectNotAuthorized(failedUpdateTestEntryResponse, {
            reason: 'Not allowed to access "testModel" entries.'
        });

        permissions.setPermissions({
            groups: { rwd: "rwd" },
            models: { rwd: "rwd" },
            entries: { rwd: "rw" }
        });

        const { manage: manageApiC } = useTestModelHandler({
            identity: identityC,
            permissions: permissions.getPermissions()
        });

        const updateTestEntryResponse = await manageApiC.updateTestEntry({
            revision: testEntry.data.id,
            data: { title: "Test - UPDATE" }
        });

        expect(updateTestEntryResponse).toMatchObject({
            data: { title: "Test - UPDATE" },
            error: null
        });
    });
});
