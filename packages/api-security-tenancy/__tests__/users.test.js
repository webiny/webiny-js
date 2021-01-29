import useGqlHandler from "./useGqlHandler";
import mocks from "./mocks/securityUser";
import groupMocks from "./mocks/securityGroup";
import md5 from "md5";

const createGravatar = email => `https://www.gravatar.com/avatar/${md5(email)}`;

describe("Security User CRUD Test", () => {
    const { install, securityUser, securityGroup } = useGqlHandler();
    let groupA;
    let groupB;

    const adminData = { firstName: "John", lastName: "Doe", login: "admin@webiny.com" };

    beforeEach(async () => {
        await install.install({
            data: adminData
        });
    });

    test("should create, read, update and delete users", async () => {
        // Create user groups
        let [response] = await securityGroup.create({
            data: groupMocks.groupA
        });

        groupA = response.data.security.createGroup.data;
        expect(response).toEqual({
            data: {
                security: {
                    createGroup: {
                        data: groupMocks.groupA,
                        error: null
                    }
                }
            }
        });

        [response] = await securityGroup.create({
            data: groupMocks.groupB
        });

        groupB = response.data.security.createGroup.data;

        // Let's create a user.
        [response] = await securityUser.create({
            data: {
                ...mocks.userA,
                group: groupA.slug
            }
        });

        expect(response).toEqual({
            data: {
                security: {
                    createUser: {
                        data: {
                            ...mocks.userA,
                            gravatar: createGravatar(mocks.userA.login),
                            group: {
                                slug: groupMocks.groupA.slug,
                                name: groupMocks.groupA.name
                            }
                        },
                        error: null
                    }
                }
            }
        });

        [response] = await securityUser.create({
            data: {
                ...mocks.userB,
                group: groupA.slug
            }
        });

        expect(response).toEqual({
            data: {
                security: {
                    createUser: {
                        data: {
                            ...mocks.userB,
                            gravatar: createGravatar(mocks.userB.login),
                            group: {
                                slug: groupA.slug,
                                name: groupA.name
                            }
                        },
                        error: null
                    }
                }
            }
        });

        // Let's check whether both of the group exists
        [response] = await securityUser.list();

        expect(response).toMatchObject({
            data: {
                security: {
                    listUsers: {
                        data: [
                            {
                                firstName: "John",
                                lastName: "Doe",
                                login: "admin@webiny.com",
                                group: {
                                    slug: "full-access"
                                }
                            },
                            {
                                ...mocks.userA,
                                gravatar: createGravatar(mocks.userA.login),
                                group: {
                                    slug: groupA.slug,
                                    name: groupA.name
                                }
                            },
                            {
                                ...mocks.userB,
                                gravatar: createGravatar(mocks.userB.login),
                                group: {
                                    slug: groupA.slug,
                                    name: groupA.name
                                }
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // Let's update the "userB" name
        const updatedName = "User B";
        [response] = await securityUser.update({
            login: mocks.userB.login,
            data: {
                lastName: updatedName
            }
        });

        expect(response).toEqual({
            data: {
                security: {
                    updateUser: {
                        data: {
                            ...mocks.userB,
                            lastName: updatedName,
                            gravatar: createGravatar(mocks.userB.login),
                            group: {
                                name: "Group-A",
                                slug: "group-a"
                            }
                        },
                        error: null
                    }
                }
            }
        });

        // Delete  "userB"
        [response] = await securityUser.delete({
            login: mocks.userB.login
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
        [response] = await securityUser.get({
            login: mocks.userB.login
        });

        expect(response).toEqual({
            data: {
                security: {
                    getUser: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: `User "${mocks.userB.login}" was not found!`
                        }
                    }
                }
            }
        });

        // Should contain "userA"
        [response] = await securityUser.get({ login: mocks.userA.login });

        expect(response).toEqual({
            data: {
                security: {
                    getUser: {
                        data: {
                            ...mocks.userA,
                            gravatar: createGravatar(mocks.userA.login),
                            group: {
                                slug: groupMocks.groupA.slug,
                                name: groupMocks.groupA.name
                            }
                        },
                        error: null
                    }
                }
            }
        });

        // Update user's group
        [response] = await securityUser.update({
            login: mocks.userA.login,
            data: { group: groupB.slug }
        });

        expect(response).toEqual({
            data: {
                security: {
                    updateUser: {
                        data: {
                            ...mocks.userA,
                            gravatar: createGravatar(mocks.userA.login),
                            group: {
                                slug: groupB.slug,
                                name: groupB.name
                            }
                        },
                        error: null
                    }
                }
            }
        });
    });

    test("should not allow creation of user without a group", async () => {
        const [{ errors }] = await securityUser.create({
            data: { ...mocks.userA, login: "admin@webiny.com" }
        });

        expect(errors.length).toBe(1);
        expect(
            errors[0].message.includes("Field group of required type String! was not provided.")
        ).toBe(true);
    });

    test("should not allow creating a user if login is taken", async () => {
        // Creating a user with same "email" should not be allowed
        const [response] = await securityUser.create({
            data: { ...mocks.userA, login: "admin@webiny.com", group: groupA.slug }
        });

        expect(response).toEqual({
            data: {
                security: {
                    createUser: {
                        data: null,
                        error: {
                            code: "USER_EXISTS",
                            message: "User with that login already exists.",
                            data: null
                        }
                    }
                }
            }
        });
    });

    test("should return current user based on identity", async () => {
        // Creating a user with same "email" should not be allowed
        const [response] = await securityUser.getCurrentUser();

        expect(response).toEqual({
            data: {
                security: {
                    getCurrentUser: {
                        data: {
                            ...adminData,
                            avatar: null
                        },
                        error: null
                    }
                }
            }
        });
    });
});
