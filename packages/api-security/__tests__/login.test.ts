import useGqlHandler from "./useGqlHandler";

describe(`"Login" test`, () => {
    const { install, securityIdentity } = useGqlHandler();

    beforeEach(async () => {
        const [response] = await install.install();
        if (response.data.security.install.error) {
            throw new Error(response.data.security.install.error.message);
            process.exit(0);
        }
    });

    test("Should be able to login", async () => {
        const [response] = await securityIdentity.login();

        expect(response).toEqual({
            data: {
                security: {
                    login: {
                        data: {
                            id: "123456789",
                            displayName: "John Doe",
                            access: [{ id: "root", name: "Root", permissions: [{ name: "*" }] }]
                        },
                        error: null
                    }
                }
            }
        });
    });
});
