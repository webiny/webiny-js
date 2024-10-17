import { useGraphQlHandler } from "./handlers/graphQlHandler";

jest.setTimeout(90000);

describe("install", () => {
    beforeEach(async () => {
        process.env.S3_BUCKET = "a-mock-s3-bucket-which-does-not-exist";
    });

    const wcpOptions = ["on", "off"];

    it.each(wcpOptions)("should validate that no app is installed - wcp %s", async wcp => {
        const {
            isAdminUsersInstalled,
            isTenancyInstalled,
            isSecurityInstalled,
            isHeadlessCmsInstalled,
            isPageBuilderInstalled,
            isFormBuilderInstalled,
            isLocaleInstalled
        } = useGraphQlHandler({
            path: "/graphql",
            features: wcp === "on" ? true : false
        });

        const [isAdminUsersInstalledResult] = await isAdminUsersInstalled();

        expect(isAdminUsersInstalledResult).toEqual({
            data: {
                adminUsers: {
                    version: null
                }
            }
        });

        const [isTenancyInstalledResult] = await isTenancyInstalled();
        expect(isTenancyInstalledResult).toEqual({
            data: {
                tenancy: {
                    version: null
                }
            }
        });

        const [isSecurityInstalledResult] = await isSecurityInstalled();
        expect(isSecurityInstalledResult).toEqual({
            data: {
                security: {
                    version: null
                }
            }
        });

        const [isLocaleInstalledResult] = await isLocaleInstalled();
        expect(isLocaleInstalledResult).toEqual({
            data: {
                i18n: {
                    version: null
                }
            }
        });

        const [isHeadlessCmsInstalledResult] = await isHeadlessCmsInstalled();

        expect(isHeadlessCmsInstalledResult).toEqual({
            data: {
                cms: {
                    version: null
                }
            }
        });

        const [isPageBuilderInstalledResult] = await isPageBuilderInstalled();
        expect(isPageBuilderInstalledResult).toEqual({
            data: {
                pageBuilder: {
                    version: null
                }
            }
        });

        const [isFormBuilderInstalledResult] = await isFormBuilderInstalled();
        expect(isFormBuilderInstalledResult).toEqual({
            data: {
                formBuilder: {
                    version: null
                }
            }
        });
    });

    it.each(wcpOptions)("should install system - wcp %s", async wcp => {
        const {
            installSecurity,
            installTenancy,
            installAdminUsers,
            installFormBuilder,
            installPageBuilder,
            installHeadlessCms,
            installI18N,
            login,
            isAdminUsersInstalled,
            isTenancyInstalled,
            isSecurityInstalled,
            isHeadlessCmsInstalled,
            isPageBuilderInstalled,
            isFormBuilderInstalled,
            isLocaleInstalled
        } = useGraphQlHandler({
            path: "/graphql",
            features: wcp === "on" ? true : false
        });
        const [installTenancyResult] = await installTenancy();
        expect(installTenancyResult).toEqual({
            data: {
                tenancy: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [installSecurityResult] = await installSecurity();
        expect(installSecurityResult).toEqual({
            data: {
                security: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        login();

        const [installAdminUsersResult] = await installAdminUsers();
        expect(installAdminUsersResult).toEqual({
            data: {
                adminUsers: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [installI18NResult] = await installI18N({
            variables: {
                data: {
                    code: "en-US"
                }
            }
        });
        expect(installI18NResult).toEqual({
            data: {
                i18n: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [installCmsResult] = await installHeadlessCms();
        expect(installCmsResult).toEqual({
            data: {
                cms: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [installPageBuilderResult] = await installPageBuilder({
            variables: {
                data: {
                    insertDemoData: false,
                    name: "My Website",
                    websiteUrl: "https://www.webiny.com"
                }
            }
        });
        expect(installPageBuilderResult).toEqual({
            data: {
                pageBuilder: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [installFormBuilderResult] = await installFormBuilder();
        expect(installFormBuilderResult).toEqual({
            data: {
                formBuilder: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [isAdminUsersInstalledResult] = await isAdminUsersInstalled();

        expect(isAdminUsersInstalledResult).toEqual({
            data: {
                adminUsers: {
                    version: "true"
                }
            }
        });

        const [isTenancyInstalledResult] = await isTenancyInstalled();
        expect(isTenancyInstalledResult).toEqual({
            data: {
                tenancy: {
                    version: "true"
                }
            }
        });

        const [isSecurityInstalledResult] = await isSecurityInstalled();
        expect(isSecurityInstalledResult).toEqual({
            data: {
                security: {
                    version: "true"
                }
            }
        });

        const [isLocaleInstalledResult] = await isLocaleInstalled();
        expect(isLocaleInstalledResult).toEqual({
            data: {
                i18n: {
                    version: "true"
                }
            }
        });

        const [isHeadlessCmsInstalledResult] = await isHeadlessCmsInstalled();

        expect(isHeadlessCmsInstalledResult).toEqual({
            data: {
                cms: {
                    version: "true"
                }
            }
        });

        const [isPageBuilderInstalledResult] = await isPageBuilderInstalled();
        expect(isPageBuilderInstalledResult).toEqual({
            data: {
                pageBuilder: {
                    version: "true"
                }
            }
        });

        const [isFormBuilderInstalledResult] = await isFormBuilderInstalled();
        expect(isFormBuilderInstalledResult).toEqual({
            data: {
                formBuilder: {
                    version: "true"
                }
            }
        });
    });
});
