import { useGraphQlHandler } from "./handlers/graphQlHandler";

describe("install", () => {
    it("should validate that no app is installed", async () => {
        const {
            isAdminUsersInstalled,
            isTenancyInstalled,
            isSecurityInstalled,
            isHeadlessCmsInstalled,
            isPageBuilderInstalled,
            isFormBuilderInstalled,
            isLocaleInstalled
        } = useGraphQlHandler({
            path: "/graphql"
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
});
