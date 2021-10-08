import useGqlHandler from "./useGqlHandler";
import mocks from "./mocks/securityGroup";

describe("Security Group CRUD Test", () => {
    const { install, securityGroup } = useGqlHandler();

    beforeEach(async () => {
        await install.install({
            data: { firstName: "John", lastName: "Doe", login: "admin@webiny.com" }
        });
    });

    test("should able to create, read, update and delete `Security Groups`", async () => {
        let [response] = await securityGroup.create({ data: mocks.groupA });

        // Let's create two groups.
        expect(response).toEqual({
            data: {
                security: {
                    createGroup: {
                        data: mocks.groupA,
                        error: null
                    }
                }
            }
        });

        [response] = await securityGroup.create({ data: mocks.groupB });

        expect(response).toEqual({
            data: {
                security: {
                    createGroup: {
                        data: mocks.groupB,
                        error: null
                    }
                }
            }
        });

        // Let's check whether both of the group exists
        [response] = await securityGroup.list();

        expect(response.data.security.listGroups).toEqual(
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
        [response] = await securityGroup.update({
            slug: mocks.groupB.slug,
            data: {
                name: updatedName,
                permissions: mocks.groupB.permissions
            }
        });

        expect(response).toEqual({
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
        [response] = await securityGroup.delete({
            slug: mocks.groupB.slug
        });

        expect(response).toEqual({
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
        [response] = await securityGroup.get({ slug: mocks.groupB.slug });

        expect(response).toMatchObject({
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
        [response] = await securityGroup.get({ slug: mocks.groupA.slug });

        expect(response).toEqual({
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
