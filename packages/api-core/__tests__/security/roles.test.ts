import { describe, test, expect, beforeEach } from "vitest";
import { RoleFactory } from "~/features/security/roles/shared/abstractions.js";
import { useGqlHandler } from "~tests/useGqlHandler";
import mocks from "~tests/mocks/securityRole.js";

class TestRoleFactory implements RoleFactory.Interface {
    execute(): RoleFactory.Return {
        return [
            {
                name: "Test Role 1",
                slug: "test-role-1",
                description: "1st test role defined via an extension.",
                permissions: [{ name: "cms.*" }]
            },
            {
                name: "Test Role 2",
                slug: "test-role-2",
                description: "2nd test role defined via an extension.",
                permissions: [{ name: "pb.*" }]
            }
        ];
    }
}

const testRoleFactory = RoleFactory.createImplementation({
    implementation: TestRoleFactory,
    dependencies: []
});

describe("Security Role CRUD Test", () => {
    const { install, securityRole } = useGqlHandler({
        registrations: [testRoleFactory]
    });

    beforeEach(async () => {
        await install.install();
    });

    test("should able to create, read, update and delete `Security Roles`", async () => {
        const [responseA] = await securityRole.create({ data: mocks.roleA });

        // Let's create two roles.
        const roleA = responseA.data.security.createRole.data;
        expect(roleA).toEqual({ id: roleA.id, ...mocks.roleA });

        const [responseB] = await securityRole.create({ data: mocks.roleB });

        const roleB = responseB.data.security.createRole.data;
        expect(roleB).toEqual({ id: roleB.id, ...mocks.roleB });

        // Let's check whether both of the role exists
        const [listResponse] = await securityRole.list();

        expect(listResponse.data.security.listRoles).toEqual({
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
                    name: "Role-A",
                    description: "A: Dolor odit et quia animi ipsum nostrum nesciunt.",
                    slug: "role-a",
                    permissions: [
                        {
                            name: "security.*"
                        }
                    ]
                },
                {
                    name: "Role-B",
                    description: "B: Dolor odit et quia animi ipsum nostrum nesciunt.",
                    slug: "role-b",
                    permissions: [
                        {
                            name: "security.*"
                        }
                    ]
                }
            ]
        });

        // Let's update the "roleB" name
        const updatedName = "Role B - updated";
        const [updateB] = await securityRole.update({
            id: roleB.id,
            data: {
                name: updatedName,
                permissions: mocks.roleB.permissions
            }
        });

        expect(updateB).toEqual({
            data: {
                security: {
                    updateRole: {
                        data: {
                            ...mocks.roleB,
                            name: updatedName
                        },
                        error: null
                    }
                }
            }
        });

        // Let's delete  "roleB"
        const [deleteB] = await securityRole.delete({
            id: roleB.id
        });

        expect(deleteB).toEqual({
            data: {
                security: {
                    deleteRole: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Should not contain "roleB"
        const [getB] = await securityRole.get({ id: roleB.id });

        expect(getB).toMatchObject({
            data: {
                security: {
                    getRole: {
                        data: null,
                        error: {
                            code: "ROLE_NOT_FOUND",
                            data: null
                        }
                    }
                }
            }
        });

        // Should contain "roleA" by slug
        const [getA] = await securityRole.get({ id: roleA.id });

        expect(getA).toEqual({
            data: {
                security: {
                    getRole: {
                        data: mocks.roleA,
                        error: null
                    }
                }
            }
        });
    });

    test('should not allow creating a role with same "slug"', async () => {
        // Creating a role
        await securityRole.create({ data: mocks.roleA });

        // Creating a role with same "slug" should not be allowed
        const [response] = await securityRole.create({ data: mocks.roleA });

        expect(response).toEqual({
            data: {
                security: {
                    createRole: {
                        data: null,
                        error: {
                            code: "ROLE_EXISTS",
                            message: `Role with slug "${mocks.roleA.slug}" already exists.`,
                            data: {
                                slug: "role-a"
                            }
                        }
                    }
                }
            }
        });
    });

    test("should not allow update of a role created via a plugin", async () => {
        // Creating a role with same "slug" should not be allowed
        const [response] = await securityRole.update({
            id: "test-role-1",
            data: {
                name: "Test Role 1 - updated"
            }
        });

        expect(response).toEqual({
            data: {
                security: {
                    updateRole: {
                        data: null,
                        error: {
                            code: "CANNOT_UPDATE_PLUGIN_ROLES",
                            data: null,
                            message: "Cannot update roles created via plugins."
                        }
                    }
                }
            }
        });
    });

    test("should not allow deletion of a role created via a plugin", async () => {
        const [response] = await securityRole.delete({ id: "test-role-1" });

        expect(response).toEqual({
            data: {
                security: {
                    deleteRole: {
                        data: null,
                        error: {
                            code: "CANNOT_DELETE_PLUGIN_ROLES",
                            data: null,
                            message: "Cannot delete roles created via plugins."
                        }
                    }
                }
            }
        });
    });
});
