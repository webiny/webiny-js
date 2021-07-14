import useGqlHandler from "./useGqlHandler";

describe("System CRUD", () => {
    const { install, getVersion } = useGqlHandler();

    test("it should install the i18n", async () => {
        const [response] = await install({
            data: {
                code: "hr-HR"
            }
        });

        expect(response).toEqual({
            data: {
                i18n: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });
    });

    test("it should not allow install mutation to run more than once", async () => {
        const [response] = await install({
            data: {
                code: "hr-HR"
            }
        });

        expect(response).toEqual({
            data: {
                i18n: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [errorResponse] = await install({
            data: {
                code: "hr-HR"
            }
        });

        expect(errorResponse).toEqual({
            data: {
                i18n: {
                    install: {
                        data: null,
                        error: {
                            message: "I18N is already installed.",
                            code: "INSTALL_ERROR",
                            data: {
                                version: process.env.WEBINY_VERSION
                            }
                        }
                    }
                }
            }
        });
    });

    test("it should fail the version check if i18n not install", async () => {
        const [response] = await getVersion();

        expect(response).toEqual({
            data: {
                i18n: {
                    version: null
                }
            }
        });
    });
});
