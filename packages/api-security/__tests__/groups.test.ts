import useGqlHandler from "./useGqlHandler";
import mocks from "./mocks/securityGroup";

describe("Security Group CRUD Test", () => {
    const { install, securityGroup } = useGqlHandler({ fullAccess: true });

    beforeEach(async () => {
        await install.install();
    });

    test("should able to create, read, update and delete `Security Groups`", async () => {
        const [responseA] = await securityGroup.create({ data: mocks.groupA });

        // Let's create two groups.
        const groupA = responseA.data.security.createGroup.data;
        expect(groupA).toEqual({ id: groupA.id, ...mocks.groupA });

        const [responseB] = await securityGroup.create({ data: mocks.groupB });

        const groupB = responseB.data.security.createGroup.data;
        expect(groupB).toEqual({ id: groupB.id, ...mocks.groupB });

        // Let's check whether both of the group exists
        const [listResponse] = await securityGroup.list();

        expect(listResponse.data.security.listGroups).toEqual(
            expect.objectContaining({
                data: expect.arrayContaining([
                    {
                        name: expect.any(String),
                        description: expect.any(String),
                        slug: expect.stringMatching(/anonymous|full-access|group-a|group-b/),
                        permissions: expect.any(Array)
                    }
                ]),
                error: null
            })
        );

        // Let's update the "groupB" name
        const updatedName = "Group B - updated";
        const [updateB] = await securityGroup.update({
            id: groupB.id,
            data: {
                name: updatedName,
                permissions: mocks.groupB.permissions
            }
        });

        expect(updateB).toEqual({
            data: {
                security: {
                    updateGroup: {
                        data: {
                            ...mocks.groupB,
                            name: updatedName
                        },
                        error: null
                    }
                }
            }
        });

        // Let's delete  "groupB"
        const [deleteB] = await securityGroup.delete({
            id: groupB.id
        });

        expect(deleteB).toEqual({
            data: {
                security: {
                    deleteGroup: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Should not contain "groupB"
        const [getB] = await securityGroup.get({ id: groupB.id });

        expect(getB).toMatchObject({
            data: {
                security: {
                    getGroup: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null
                        }
                    }
                }
            }
        });

        // Should contain "groupA" by slug
        const [getA] = await securityGroup.get({ id: groupA.id });

        expect(getA).toEqual({
            data: {
                security: {
                    getGroup: {
                        data: mocks.groupA,
                        error: null
                    }
                }
            }
        });
    });

    test('should not allow creating a group with same "slug"', async () => {
        // Creating a group
        await securityGroup.create({ data: mocks.groupA });

        // Creating a group with same "slug" should not be allowed
        const [response] = await securityGroup.create({ data: mocks.groupA });

        expect(response).toEqual({
            data: {
                security: {
                    createGroup: {
                        data: null,
                        error: {
                            code: "GROUP_EXISTS",
                            message: `Group with slug "${mocks.groupA.slug}" already exists.`,
                            data: null
                        }
                    }
                }
            }
        });
    });
});
