import useGqlHandler from "./useGqlHandler";
import mocks from "./mocks/securityGroup";

describe("Security Group CRUD Test", () => {
    const { securityGroup } = useGqlHandler();
    let groupAId, groupBId;

    test("should able to create, read, update and delete `Security Groups`", async () => {
        let [response] = await securityGroup.create({ data: mocks.groupA });

        // Let's create two groups.
        groupAId = response.data.security.createGroup.data.id;
        expect(response).toEqual({
            data: {
                security: {
                    createGroup: {
                        data: {
                            ...mocks.groupA,
                            id: groupAId
                        },
                        error: null
                    }
                }
            }
        });

        [response] = await securityGroup.create({ data: mocks.groupB });

        groupBId = response.data.security.createGroup.data.id;
        expect(response).toEqual({
            data: {
                security: {
                    createGroup: {
                        data: {
                            ...mocks.groupB,
                            id: groupBId
                        },
                        error: null
                    }
                }
            }
        });

        // Let's check whether both of the group exists
        [response] = await securityGroup.list();

        expect(response).toEqual({
            data: {
                security: {
                    listGroups: {
                        data: [
                            {
                                ...mocks.groupA,
                                id: groupAId
                            },
                            {
                                ...mocks.groupB,
                                id: groupBId
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // Let's update the "groupB" name
        const updatedName = "Group B - updated";
        [response] = await securityGroup.update({
            id: groupBId,
            data: { name: updatedName }
        });

        expect(response).toEqual({
            data: {
                security: {
                    updateGroup: {
                        data: {
                            ...mocks.groupB,
                            id: groupBId,
                            name: updatedName
                        },
                        error: null
                    }
                }
            }
        });

        // Let's delete  "groupB"
        [response] = await securityGroup.delete({
            id: groupBId
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
        [response] = await securityGroup.get({ id: groupBId });

        expect(response).toEqual({
            data: {
                security: {
                    getGroup: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: `Unable to find group with id: ${groupBId}`
                        }
                    }
                }
            }
        });

        // Should contain "groupA"
        [response] = await securityGroup.get({ id: groupAId });

        expect(response).toEqual({
            data: {
                security: {
                    getGroup: {
                        data: {
                            ...mocks.groupA,
                            id: groupAId
                        },
                        error: null
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
                        data: {
                            ...mocks.groupA,
                            id: groupAId
                        },
                        error: null
                    }
                }
            }
        });
    });

    test('should not allow creating a group with same "slug"', async () => {
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

    test('should filter and sort by "name"', async () => {
        // Add "Group-B
        let [response] = await securityGroup.create({ data: mocks.groupB });
        groupBId = response.data.security.createGroup.data.id;

        // should return empty array for group name begins with "cms"
        [response] = await securityGroup.list({ where: { nameBeginsWith: "cms" }, sort: 1 });

        expect(response).toEqual({
            data: {
                security: {
                    listGroups: {
                        data: [],
                        error: null
                    }
                }
            }
        });

        // should return data array for group name begins with "group"
        [response] = await securityGroup.list({ where: { nameBeginsWith: "group" }, sort: 1 });

        expect(response).toEqual({
            data: {
                security: {
                    listGroups: {
                        data: [
                            {
                                ...mocks.groupA,
                                id: groupAId
                            },
                            {
                                ...mocks.groupB,
                                id: groupBId
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // should return data array in "DESC" order for group name begins with "group" and "sort" -1
        [response] = await securityGroup.list({ where: { nameBeginsWith: "group" }, sort: -1 });

        expect(response).toEqual({
            data: {
                security: {
                    listGroups: {
                        data: [
                            {
                                ...mocks.groupB,
                                id: groupBId
                            },
                            {
                                ...mocks.groupA,
                                id: groupAId
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });
});
