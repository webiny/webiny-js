import useGqlHandler from "./useGqlHandler";

describe(`Test "Admin Users" install`, () => {
    const { install } = useGqlHandler({ fullAccess: true });

    beforeEach(async () => {
        await install.installTenancy();
        await install.installSecurity();
    });

    test(`should return null for "version"`, async () => {
        const [response] = await install.isInstalled();

        expect(response).toEqual({
            data: {
                adminUsers: {
                    version: null
                }
            }
        });
    });

    test(`should run "install" successfully`, async () => {
        const [installResponse] = await install.install({
            data: {
                firstName: "first test",
                lastName: "last test",
                email: "firstlast@test.com",
                password: "12345678"
            }
        });

        expect(installResponse).toEqual({
            data: {
                adminUsers: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Running "install" again should throw an error
        const [reinstallResponse] = await install.install({
            data: {
                firstName: "first test",
                lastName: "last test",
                email: "firstlast@test.com",
                password: "12345678"
            }
        });

        expect(reinstallResponse).toEqual({
            data: {
                adminUsers: {
                    install: {
                        data: null,
                        error: {
                            code: "ADMIN_USERS_INSTALL_ABORTED",
                            data: null,
                            message: "Admin Users is already installed."
                        }
                    }
                }
            }
        });

        const [isInstalledResponse] = await install.isInstalled();

        expect(isInstalledResponse).toEqual({
            data: {
                adminUsers: {
                    version: process.env.WEBINY_VERSION
                }
            }
        });
    });
});
