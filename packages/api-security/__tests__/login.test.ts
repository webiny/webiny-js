import useGqlHandler from "./useGqlHandler";
import { defaultIdentity } from "./mocks/defaultIdentity";

describe(`"Login" test`, () => {
    const { install, securityIdentity } = useGqlHandler({ plugins: [defaultIdentity()] });

    beforeEach(async () => {
        const [response] = await install.install({
            "x-tenant": "root"
        });

        if (response.data.security.install.error) {
            throw new Error(response.data.security.install.error.message);
            // @ts-expect-error
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
                            type: "admin",
                            permissions: [
                                {
                                    name: "*"
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });
    });
});
