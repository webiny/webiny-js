import useGqlHandler from "./useGqlHandler";
import mocks from "./mocks/securityUser";
import md5 from "md5";
import { AdminUser } from "@webiny/api-admin-users/types";

const createGravatar = (email: string) => `https://www.gravatar.com/avatar/${md5(email)}`;

describe("Security User CRUD Test", () => {
    const { install, adminUsers, securityGroups } = useGqlHandler({ fullAccess: true });

    const adminData = {
        firstName: "John",
        lastName: "Doe",
        email: "admin@webiny.com"
    };

    beforeEach(async () => {
        await install.install({ data: { ...adminData, password: "12345678" } });

        const [groupResponseA] = await securityGroups.get({ slug: "full-access" });
        const fullAccessGroup = groupResponseA.data.security.getGroup.data;

        // The `api-admin-users` package does not create a user in the installation process.
        // Hence, we need to include the user here. This behavior was introduced in 5.38.0.
        await adminUsers.create({
            data: {
                ...adminData,
                groups: [fullAccessGroup.id]
            }
        });
    });

    test("should create, read, update and delete users", async () => {
        const [groupResponseA] = await securityGroups.get({ slug: "full-access" });
        const fullAccessGroup = groupResponseA.data.security.getGroup.data;

        const [groupResponseB] = await securityGroups.get({ slug: "anonymous" });
        const anonymousGroup = groupResponseB.data.security.getGroup.data;

        // Let's create a user.
        const [createUserAResponse] = await adminUsers.create({
            data: {
                ...mocks.userA,
                password: "12345678",
                groups: [fullAccessGroup.id]
            }
        });

        const userA: AdminUser = createUserAResponse.data.adminUsers.createUser.data;

        expect(createUserAResponse).toEqual({
            data: {
                adminUsers: {
                    createUser: {
                        data: {
                            ...mocks.userA,
                            id: expect.any(String),
                            gravatar: createGravatar(mocks.userA.email),
                            groups: [
                                {
                                    id: fullAccessGroup.id,
                                    slug: fullAccessGroup.slug,
                                    name: fullAccessGroup.name
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });

        const [createUserBResponse] = await adminUsers.create({
            data: {
                ...mocks.userB,
                password: "12345678",
                groups: [fullAccessGroup.id]
            }
        });

        expect(createUserBResponse).toEqual({
            data: {
                adminUsers: {
                    createUser: {
                        data: {
                            ...mocks.userB,
                            id: expect.any(String),
                            gravatar: createGravatar(mocks.userB.email),
                            groups: [
                                {
                                    id: fullAccessGroup.id,
                                    name: fullAccessGroup.name,
                                    slug: fullAccessGroup.slug
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });

        const userB: AdminUser = createUserBResponse.data.adminUsers.createUser.data;

        // Let's check if both users exist
        const [listUsersResponse] = await adminUsers.list();

        expect(listUsersResponse).toMatchObject({
            data: {
                adminUsers: {
                    listUsers: {
                        data: [
                            {
                                firstName: "John",
                                lastName: "Doe",
                                email: "admin@webiny.com",
                                groups: [
                                    {
                                        slug: "full-access"
                                    }
                                ]
                            },
                            userA,
                            userB
                        ],
                        error: null
                    }
                }
            }
        });

        // Let's update the "userB" name
        const updatedName = "User B";
        const [updateUserResponse] = await adminUsers.update({
            id: userB.id,
            data: {
                lastName: updatedName
            }
        });

        expect(updateUserResponse).toEqual({
            data: {
                adminUsers: {
                    updateUser: {
                        data: {
                            ...userB,
                            lastName: updatedName
                        },
                        error: null
                    }
                }
            }
        });

        // Delete  "userB"
        const [deleteUserResponse] = await adminUsers.delete({ id: userB.id });

        expect(deleteUserResponse).toEqual({
            data: {
                adminUsers: {
                    deleteUser: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Should not contain "userB"
        const [getUserBResponse] = await adminUsers.get({ email: userB.email });

        expect(getUserBResponse).toEqual({
            data: {
                adminUsers: {
                    getUser: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: `User \"{\"email\":\"${mocks.userB.email}\"}\" was not found!`
                        }
                    }
                }
            }
        });

        // Should contain "userA"
        const [getUserAResponse] = await adminUsers.get({ email: userA.email });

        expect(getUserAResponse).toEqual({
            data: {
                adminUsers: {
                    getUser: {
                        data: userA,
                        error: null
                    }
                }
            }
        });

        // Update user's group
        const [updateUserAResponse] = await adminUsers.update({
            id: userA.id,
            data: { groups: [anonymousGroup.id] }
        });

        expect(updateUserAResponse).toEqual({
            data: {
                adminUsers: {
                    updateUser: {
                        data: {
                            ...userA,
                            groups: [
                                {
                                    id: anonymousGroup.id,
                                    name: anonymousGroup.name,
                                    slug: anonymousGroup.slug
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });
    });

    test("should not allow creating a user if email is taken", async () => {
        const [groupResponseA] = await securityGroups.get({ slug: "full-access" });
        const fullAccessGroup = groupResponseA.data.security.getGroup.data;

        // Creating a user with same "email" should not be allowed
        const [response] = await adminUsers.create({
            data: {
                ...mocks.userA,
                email: "admin@webiny.com",
                groups: [fullAccessGroup.id],
                password: "12345678"
            }
        });

        expect(response).toEqual({
            data: {
                adminUsers: {
                    createUser: {
                        data: null,
                        error: {
                            code: "USER_EXISTS",
                            message: "User with that email already exists.",
                            data: {
                                email: "admin@webiny.com"
                            }
                        }
                    }
                }
            }
        });
    });

    test("should return current user based on identity", async () => {
        const [groupResponseA] = await securityGroups.get({ slug: "full-access" });
        const fullAccessGroup = groupResponseA.data.security.getGroup.data;

        // Creating a user with same "email" should not be allowed
        const [response] = await adminUsers.getCurrentUser();

        expect(response).toEqual({
            data: {
                adminUsers: {
                    getCurrentUser: {
                        data: {
                            ...adminData,
                            id: expect.any(String),
                            gravatar: createGravatar(adminData.email),
                            avatar: null,
                            groups: [
                                {
                                    id: fullAccessGroup.id,
                                    name: fullAccessGroup.name,
                                    slug: fullAccessGroup.slug
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });
    });

    test("should not allow deletion of own user account", async () => {
        const [getUserResponse] = await adminUsers.get({ email: "admin@webiny.com" });
        const user = getUserResponse.data.adminUsers.getUser.data;

        const [response] = await adminUsers.delete({ id: user.id });

        expect(response).toEqual({
            data: {
                adminUsers: {
                    deleteUser: {
                        data: null,
                        error: {
                            message: `You can't delete your own user account.`,
                            code: "",
                            data: null
                        }
                    }
                }
            }
        });
    });
});
