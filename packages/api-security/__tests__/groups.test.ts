import useGqlHandler from "./useGqlHandler";
import mocks from "./mocks/securityGroup";
import { createSecurityRolePlugin } from "~/plugins/SecurityRolePlugin";

describe("Security Group CRUD Test", () => {
    const { install, securityGroup } = useGqlHandler({
        plugins: [
            createSecurityRolePlugin({
                id: "test-role-1",
                name: "Test Role 1",
                description: "1st test role defined via an extension.",
                permissions: [{ name: "cms.*" }]
            }),
            createSecurityRolePlugin({
                id: "test-role-2",
                name: "Test Role 2",
                description: "2nd test role defined via an extension.",
                permissions: [{ name: "pb.*" }]
            })
        ]
    });

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

        expect(listResponse.data.security.listGroups).toEqual({
            error: null,
            data: [
                {
                    name: "Test Role 1",
                    description: "1st test role defined via an extension.",
                    slug: "test-role-1",
                    permissions: [
                        {
                            name: "cms.*"
                        }
                    ]
                },
                {
                    name: "Test Role 2",
                    description: "2nd test role defined via an extension.",
                    slug: "test-role-2",
                    permissions: [
                        {
                            name: "pb.*"
                        }
                    ]
                },
                {
                    name: "Full Access",
                    description: "Grants full access to all apps.",
                    slug: "full-access",
                    permissions: [
                        {
                            name: "*"
                        }
                    ]
                },
                {
                    name: "Anonymous",
                    description: "Permissions for anonymous users (public access).",
                    slug: "anonymous",
                    permissions: []
                },
                {
                    name: "Group-A",
                    description: "A: Dolor odit et quia animi ipsum nostrum nesciunt.",
                    slug: "group-a",
                    permissions: [
                        {
                            name: "security.*"
                        }
                    ]
                },
                {
                    name: "Group-B",
                    description: "B: Dolor odit et quia animi ipsum nostrum nesciunt.",
                    slug: "group-b",
                    permissions: [
                        {
                            name: "security.*"
                        }
                    ]
                }
            ]
        });

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

    test("should not allow update of a group created via a plugin", async () => {
        // Creating a group with same "slug" should not be allowed
        const [response] = await securityGroup.update({
            id: "test-role-1",
            data: {
                name: "Test Role 1 - updated"
            }
        });

        expect(response).toEqual({
            data: {
                security: {
                    updateGroup: {
                        data: null,
                        error: {
                            code: "CANNOT_UPDATE_PLUGIN_GROUPS",
                            data: null,
                            message: "Cannot update groups created via plugins."
                        }
                    }
                }
            }
        });
    });

    test("should not allow deletion of a group created via a plugin", async () => {
        // Creating a group with same "slug" should not be allowed
        const [response] = await securityGroup.delete({ id: "" });

        expect(response).toEqual({
            data: {
                security: {
                    deleteGroup: {
                        data: null,
                        error: {
                            code: "CANNOT_DELETE_PLUGIN_GROUPS",
                            data: null,
                            message: "Cannot delete groups created via plugins."
                        }
                    }
                }
            }
        });
    });
});
