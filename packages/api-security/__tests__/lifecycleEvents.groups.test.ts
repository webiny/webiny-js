import useGqlHandler from "./useGqlHandler";
import mocks from "./mocks/securityGroup";

import { assignGroupLifecycleEvents, tracker } from "./mocks/lifecycleEvents";

describe("Group Lifecycle Events", () => {
    const { install, securityGroup } = useGqlHandler({
        plugins: [assignGroupLifecycleEvents()]
    });

    beforeEach(async () => {
        await install.install();
        tracker.reset();
    });

    it("should trigger create lifecycle events", async () => {
        const [createResponse] = await securityGroup.create({ data: mocks.groupA });

        expect(createResponse).toEqual({
            data: {
                security: {
                    createGroup: {
                        data: {
                            ...mocks.groupA,
                            id: expect.any(String)
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("group:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("group:afterCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("group:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("group:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("group:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("group:afterDelete")).toEqual(false);
    });

    it("should trigger update lifecycle events", async () => {
        const [createResponse] = await securityGroup.create({ data: mocks.groupA });

        tracker.reset();

        const group = createResponse.data.security.createGroup.data;

        const updatedName = "Group A - updated";
        const [updateResponse] = await securityGroup.update({
            id: group.id,
            data: {
                name: updatedName,
                permissions: mocks.groupA.permissions
            }
        });

        expect(updateResponse).toEqual({
            data: {
                security: {
                    updateGroup: {
                        data: {
                            ...mocks.groupA,
                            name: updatedName
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("group:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("group:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("group:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("group:afterUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("group:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("group:afterDelete")).toEqual(false);
    });

    it("should trigger delete lifecycle events", async () => {
        const [createResponse] = await securityGroup.create({ data: mocks.groupA });

        tracker.reset();

        const group = createResponse.data.security.createGroup.data;

        const [deleteResponse] = await securityGroup.delete({
            id: group.id
        });

        expect(deleteResponse).toEqual({
            data: {
                security: {
                    deleteGroup: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("group:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("group:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("group:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("group:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("group:beforeDelete")).toEqual(true);
        expect(tracker.isExecutedOnce("group:afterDelete")).toEqual(true);
    });
});
