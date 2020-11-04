import useGqlHandler from "./useGqlHandler";

describe(`Test "Security" install`, () => {
    const { install } = useGqlHandler();

    test(`should return "isInstalled" false without running install`, async () => {
        const [response] = await install.isInstalled();

        expect(response).toEqual({
            data: {
                security: {
                    isInstalled: {
                        data: false,
                        error: null
                    }
                }
            }
        });
    });

    test(`should run "install" successfully`, async () => {
        let [response] = await install.install({
            data: { firstName: "first test", lastName: "last test", email: "firstlast@test.com" }
        });

        expect(response).toEqual({
            data: {
                security: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Running "install" again should throw an error
        [response] = await install.install({
            data: { firstName: "first test", lastName: "last test", email: "firstlast@test.com" }
        });

        expect(response).toEqual({
            data: {
                security: {
                    install: {
                        data: null,
                        error: {
                            code: "SECURITY_INSTALL_ABORTED",
                            data: null,
                            message: "Security is already installed."
                        }
                    }
                }
            }
        });

        // Let's see whether "isInstalled" return true now?
        [response] = await install.isInstalled();

        expect(response).toEqual({
            data: {
                security: {
                    isInstalled: {
                        data: true,
                        error: null
                    }
                }
            }
        });
    });
});
