import useGqlHandler from "./useGqlHandler";
import mocks from "./mocks/securityUser";
import groupMocks from "./mocks/securityGroup";

describe("Security User CRUD Test", () => {
    const { securityUser, securityGroup } = useGqlHandler();
    let userAId, userBId, groupAId;

    test("should able to create, read, update and delete `Security Groups`", async () => {
        // Let's create a group.
        let [response] = await securityGroup.create({ data: groupMocks.groupA });

        groupAId = response.data.security.createGroup.data.id;
        expect(response).toEqual({
            data: {
                security: {
                    createGroup: {
                        data: {
                            ...groupMocks.groupA,
                            id: groupAId
                        },
                        error: null
                    }
                }
            }
        });

        // Let's create a user.
        [response] = await securityUser.create({
            data: mocks.getUserWithGroup({ userData: mocks.userA, groupId: groupAId })
        });

        userAId = response.data.security.createUser.data.id;
        expect(response).toEqual({
            data: {
                security: {
                    createUser: {
                        data: mocks.getUserWithGroupData({
                            userData: {
                                ...mocks.userA,
                                id: userAId
                            },
                            groupData: { ...groupMocks.groupA, id: groupAId }
                        }),
                        error: null
                    }
                }
            }
        });

        [response] = await securityUser.create({
            data: mocks.getUserWithGroup({ userData: mocks.userB, groupId: groupAId })
        });

        userBId = response.data.security.createUser.data.id;
        expect(response).toEqual({
            data: {
                security: {
                    createUser: {
                        data: mocks.getUserWithGroupData({
                            userData: {
                                ...mocks.userB,
                                id: userBId
                            },
                            groupData: { ...groupMocks.groupA, id: groupAId }
                        }),
                        error: null
                    }
                }
            }
        });

        // Let's check whether both of the group exists
        [response] = await securityUser.list();

        expect(response).toEqual({
            data: {
                security: {
                    listUsers: {
                        data: [
                            mocks.getUserWithGroupData({
                                userData: {
                                    ...mocks.userA,
                                    id: userAId
                                },
                                groupData: { ...groupMocks.groupA, id: groupAId }
                            }),
                            mocks.getUserWithGroupData({
                                userData: {
                                    ...mocks.userB,
                                    id: userBId
                                },
                                groupData: { ...groupMocks.groupA, id: groupAId }
                            })
                        ],
                        error: null
                    }
                }
            }
        });

        // Let's update the "userB" name
        const updatedName = "User B";
        [response] = await securityUser.update({
            id: userBId,
            data: { lastName: updatedName }
        });

        expect(response).toEqual({
            data: {
                security: {
                    updateUser: {
                        data: mocks.getUserWithGroupData({
                            userData: {
                                ...mocks.userB,
                                id: userBId,
                                lastName: updatedName
                            },
                            groupData: { ...groupMocks.groupA, id: groupAId }
                        }),
                        error: null
                    }
                }
            }
        });

        // Let's delete  "userB"
        [response] = await securityUser.delete({
            id: userBId
        });

        expect(response).toEqual({
            data: {
                security: {
                    deleteUser: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Should not contain "userB"
        [response] = await securityUser.get({ id: userBId });

        expect(response).toEqual({
            data: {
                security: {
                    getUser: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: `User not found!`
                        }
                    }
                }
            }
        });

        // Should contain "userA"
        [response] = await securityUser.get({ id: userAId });

        expect(response).toEqual({
            data: {
                security: {
                    getUser: {
                        data: mocks.getUserWithGroupData({
                            userData: {
                                ...mocks.userA,
                                id: userAId
                            },
                            groupData: { ...groupMocks.groupA, id: groupAId }
                        }),
                        error: null
                    }
                }
            }
        });

        // Should contain "userA" by slug
        [response] = await securityUser.get({ login: mocks.userA.email });

        expect(response).toEqual({
            data: {
                security: {
                    getUser: {
                        data: mocks.getUserWithGroupData({
                            userData: {
                                ...mocks.userA,
                                id: userAId
                            },
                            groupData: { ...groupMocks.groupA, id: groupAId }
                        }),
                        error: null
                    }
                }
            }
        });
    });

    test('should not allow creating a user with same "email"', async () => {
        // Creating a user with same "email" should not be allowed
        const [response] = await securityUser.create({ data: mocks.userA });

        expect(response).toEqual({
            data: {
                security: {
                    createUser: {
                        data: null,
                        error: {
                            code: "USER_EXISTS",
                            message: "User with given e-mail already exists.",
                            data: null
                        }
                    }
                }
            }
        });
    });
});

describe(`"Login" test`, () => {
    const { securityUser } = useGqlHandler();

    test("Should be able to login", async () => {
        const [response] = await securityUser.login();

        expect(response).toEqual({
            data: {
                security: {
                    login: {
                        data: {
                            ...mocks.adminUserWithPermissions,
                            fullName:
                                mocks.adminUserWithPermissions.firstName +
                                " " +
                                mocks.adminUserWithPermissions.lastName
                        },
                        error: null
                    }
                }
            }
        });
    });

    test("Should be able to get current user", async () => {
        const [response] = await securityUser.getCurrentUser();

        expect(response).toEqual({
            data: {
                security: {
                    getCurrentUser: {
                        data: mocks.adminUser,
                        error: null
                    }
                }
            }
        });
    });

    test("Should be able to update current user", async () => {
        let [response] = await securityUser.updateCurrentUser({
            data: { email: "admin.new@webiny.com" }
        });

        expect(response).toEqual({
            data: {
                security: {
                    updateCurrentUser: {
                        data: { ...mocks.adminUser, email: "admin.new@webiny.com" },
                        error: null
                    }
                }
            }
        });

        // Let's see if the current user record updated or not
        [response] = await securityUser.getCurrentUser();

        expect(response).toEqual({
            data: {
                security: {
                    getCurrentUser: {
                        data: { ...mocks.adminUser, email: "admin.new@webiny.com" },
                        error: null
                    }
                }
            }
        });

        // Let's see if the old user record still exists
        [response] = await securityUser.get({ login: "admin@webiny.com" });

        expect(response).toEqual({
            data: {
                security: {
                    getUser: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: "User not found!"
                        }
                    }
                }
            }
        });
    });
});
