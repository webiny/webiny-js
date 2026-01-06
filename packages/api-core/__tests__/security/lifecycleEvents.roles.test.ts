import { describe, it, expect, beforeEach } from "vitest";
import { useGqlHandler } from "../useGqlHandler";

import { assignRoleLifecycleEvents, tracker } from "../mocks/lifecycleEvents";
import mocks from "~tests/mocks/securityRole.js";

describe("Role Lifecycle Events", () => {
    const { install, securityRole } = useGqlHandler({
        plugins: [assignRoleLifecycleEvents()]
    });

    beforeEach(async () => {
        await install.install();
        tracker.reset();
    });

    it("should trigger create lifecycle events", async () => {
        const [createResponse] = await securityRole.create({ data: mocks.roleA });

        expect(createResponse).toEqual({
            data: {
                security: {
                    createRole: {
                        data: {
                            ...mocks.roleA,
                            id: expect.any(String)
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("role:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("role:afterCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("role:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("role:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("role:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("role:afterDelete")).toEqual(false);
    });

    it("should trigger update lifecycle events", async () => {
        const [createResponse] = await securityRole.create({ data: mocks.roleA });

        tracker.reset();

        const role = createResponse.data.security.createRole.data;

        const updatedName = "Role A - updated";
        const [updateResponse] = await securityRole.update({
            id: role.id,
            data: {
                name: updatedName,
                permissions: mocks.roleA.permissions
            }
        });

        expect(updateResponse).toEqual({
            data: {
                security: {
                    updateRole: {
                        data: {
                            ...mocks.roleA,
                            name: updatedName
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("role:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("role:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("role:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("role:afterUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("role:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("role:afterDelete")).toEqual(false);
    });

    it("should trigger delete lifecycle events", async () => {
        const [createResponse] = await securityRole.create({ data: mocks.roleA });

        tracker.reset();

        const role = createResponse.data.security.createRole.data;

        const [deleteResponse] = await securityRole.delete({
            id: role.id
        });

        expect(deleteResponse).toEqual({
            data: {
                security: {
                    deleteRole: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("role:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("role:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("role:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("role:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("role:beforeDelete")).toEqual(true);
        expect(tracker.isExecutedOnce("role:afterDelete")).toEqual(true);
    });
});
