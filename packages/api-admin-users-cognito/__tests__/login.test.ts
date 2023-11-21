import useGqlHandler from "./useGqlHandler";
import md5 from "md5";

const createGravatar = (email: string) => `https://www.gravatar.com/avatar/${md5(email)}`;

describe(`"Login" test`, () => {
    const { install, adminUsers } = useGqlHandler();
    const email = "admin@webiny.com";

    beforeEach(async () => {
        const [response] = await install.install({
            data: { firstName: "John", lastName: "Doe", email, password: "12345678" }
        });

        if (response?.data?.adminUsers?.install?.error) {
            console.log(response.data.adminUsers.install.error);
            throw new Error(response.data.adminUsers.install.error.message);
        }
    });

    test("Should be able to login", async () => {
        // We need to mock the identity ID.
        const [response] = await adminUsers.login();

        expect(response).toEqual({
            data: {
                security: {
                    login: {
                        data: {
                            id: expect.any(String),
                            displayName: "John Doe",
                            type: "admin",
                            permissions: [{ name: "*" }],
                            profile: {
                                email,
                                firstName: "John",
                                lastName: "Doe",
                                avatar: null,
                                gravatar: createGravatar(email)
                            }
                        },
                        error: null
                    }
                }
            }
        });
    });

    test("Should be able to update current user", async () => {
        const [updateUserResponse] = await adminUsers.updateCurrentUser({
            data: { firstName: "Jane", lastName: "Wayne" }
        });

        expect(updateUserResponse).toMatchObject({
            data: {
                adminUsers: {
                    updateCurrentUser: {
                        data: {
                            firstName: "Jane",
                            lastName: "Wayne",
                            email
                        },
                        error: null
                    }
                }
            }
        });

        // Let's see if the current user record updated or not
        const [getUserResponse] = await adminUsers.get({ email });

        expect(getUserResponse).toMatchObject({
            data: {
                adminUsers: {
                    getUser: {
                        data: {
                            firstName: "Jane",
                            lastName: "Wayne",
                            email
                        },
                        error: null
                    }
                }
            }
        });
    });
});
