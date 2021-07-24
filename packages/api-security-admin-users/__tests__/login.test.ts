import useGqlHandler from "./useGqlHandler";
import md5 from "md5";

const createGravatar = email => `https://www.gravatar.com/avatar/${md5(email)}`;

describe(`"Login" test`, () => {
    const { install, securityUser } = useGqlHandler();
    const login = "admin@webiny.com";

    beforeEach(async () => {
        const [response] = await install.install({
            data: { firstName: "John", lastName: "Doe", login }
        });
        if (response?.data?.security?.install?.error) {
            console.log(response.data.security.install.error);
            throw new Error(response.data.security.install.error.message);
            process.exit(0);
        }
    });

    test("Should be able to login", async () => {
        const [response] = await securityUser.login();

        expect(response).toEqual({
            data: {
                security: {
                    login: {
                        data: {
                            login: "admin@webiny.com",
                            firstName: "John",
                            lastName: "Doe",
                            avatar: null,
                            gravatar: createGravatar(login),
                            access: [{ id: "root", name: "Root", permissions: [{ name: "*" }] }]
                        },
                        error: null
                    }
                }
            }
        });
    });

    test("Should be able to update current user", async () => {
        let [response] = await securityUser.updateCurrentUser({
            data: { firstName: "Jane", lastName: "Wayne" }
        });

        expect(response).toMatchObject({
            data: {
                security: {
                    updateCurrentUser: {
                        data: {
                            firstName: "Jane",
                            lastName: "Wayne",
                            login: "admin@webiny.com"
                        },
                        error: null
                    }
                }
            }
        });

        // Let's see if the current user record updated or not
        [response] = await securityUser.get({ login: "admin@webiny.com" });

        expect(response).toMatchObject({
            data: {
                security: {
                    getUser: {
                        data: {
                            firstName: "Jane",
                            lastName: "Wayne",
                            login: "admin@webiny.com"
                        },
                        error: null
                    }
                }
            }
        });
    });
});
