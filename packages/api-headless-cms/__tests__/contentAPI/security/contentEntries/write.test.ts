import { describe, expect, it } from "vitest";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { CmsTestPermissions, expectNotAuthorized } from "../utils";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

const identityA: IdentityData = { id: "a", type: "admin", displayName: "A" };
const identityB: IdentityData = { id: "b", type: "admin", displayName: "B" };
const identityC: IdentityData = { id: "c", type: "admin", displayName: "C" };

describe("Write Permissions Checks", () => {
    it("should allow creation of entries only with sufficient permission", async () => {
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
            code: "Cms/Entry/NotAuthorized",
            message: 'Not allowed to access "testModel" entries.'
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

    it("should allow update of groups only with sufficient permission", async () => {
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
            variables: {
                revision: testEntry.data.id,
                data: {
                    values: {
                        title: "Test - UPDATE"
                    }
                }
            }
        });

        expectNotAuthorized(failedUpdateTestEntryResponse, {
            code: "Cms/Entry/NotAuthorized",
            message: 'Not allowed to access "testModel" entries.'
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
            variables: {
                revision: testEntry.data.id,
                data: {
                    values: {
                        title: "Test - UPDATE"
                    }
                }
            }
        });

        expect(updateTestEntryResponse).toMatchObject({
            data: {
                values: {
                    title: "Test - UPDATE"
                }
            },
            error: null
        });
    });

    it("should allow duplication of entries only with sufficient permission", async () => {
        const { manage: manageApiA } = useTestModelHandler({ identity: identityA });
        await manageApiA.setup();

        const testEntry = await manageApiA.createTestEntry();

        const permissions = new CmsTestPermissions({
            groups: { rwd: "rwd" },
            models: { rwd: "rwd" },
            entries: { rwd: "r" }
        });

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: permissions.getPermissions()
        });

        const failedDuplicateResponse = await manageApiB.duplicateTestEntry({
            variables: {
                revision: testEntry.data.id
            }
        });

        expectNotAuthorized(failedDuplicateResponse, {
            code: "Cms/Entry/NotAuthorized",
            message: 'Not allowed to access "testModel" entries.'
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

        const duplicateResponse = await manageApiC.duplicateTestEntry({
            variables: {
                revision: testEntry.data.id
            }
        });

        expect(duplicateResponse).toMatchObject({
            data: {
                createdBy: {
                    id: identityC.id
                },
                meta: {
                    version: 1,
                    status: "draft"
                }
            },
            error: null
        });
        expect(duplicateResponse.data.entryId).not.toEqual(testEntry.data.entryId);
    });

    it("should not allow duplication of entries owned by others with own-only permission", async () => {
        const { manage: manageApiA } = useTestModelHandler({ identity: identityA });
        await manageApiA.setup();

        const testEntry = await manageApiA.createTestEntry();

        const permissions = new CmsTestPermissions({
            groups: { rwd: "rwd" },
            models: { rwd: "rwd" },
            entries: { rwd: "rwd", own: true }
        });

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: permissions.getPermissions()
        });

        const failedDuplicateResponse = await manageApiB.duplicateTestEntry({
            variables: {
                revision: testEntry.data.id
            }
        });

        expectNotAuthorized(failedDuplicateResponse, {
            code: "Cms/Entry/NotAuthorized",
            message: `Not allowed to access entry "${testEntry.data.entryId}".`
        });

        const ownEntry = await manageApiB.createTestEntry();
        const duplicateOwnResponse = await manageApiB.duplicateTestEntry({
            variables: {
                revision: ownEntry.data.id
            }
        });

        expect(duplicateOwnResponse).toMatchObject({
            data: {
                createdBy: {
                    id: identityB.id
                },
                meta: {
                    version: 1,
                    status: "draft"
                }
            },
            error: null
        });
    });
});
