import useGqlHandler from "./useGqlHandler";
import md5 from "md5";

const createGravatar = (email: string) => `https://www.gravatar.com/avatar/${md5(email)}`;

describe(`"Login" test`, () => {
    const { install, adminUsers, securityGroups } = useGqlHandler({ fullAccess: true });
    const email = "admin@webiny.com";

    const adminData = {
        firstName: "John",
        lastName: "Doe",
        email: "admin@webiny.com"
    };

    beforeEach(async () => {
        const [response] = await install.install({ data: { ...adminData, password: "12345678" } });
        if (response?.data?.adminUsers?.install?.error) {
            console.log(response.data.adminUsers.install.error);
            throw new Error(response.data.adminUsers.install.error.message);
        }

        // The `api-admin-users` package does not create a user in the installation process.
        // Hence, we need to include the user here. This behavior was introduced in 5.38.0.
        const [groupResponseA] = await securityGroups.get({ slug: "full-access" });
        const fullAccessGroup = groupResponseA.data.security.getGroup.data;

        await adminUsers.create({
            data: {
                ...adminData,
                group: fullAccessGroup.id
            }
        });
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
});
