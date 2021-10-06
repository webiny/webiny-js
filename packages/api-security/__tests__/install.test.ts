import useGqlHandler from "./useGqlHandler";

describe(`Test "Security" install`, () => {
    const { install, securityGroup } = useGqlHandler();
    
    beforeEach(async () => {
        await install.installTenancy();
    });

    test(`should return null for "version"`, async () => {
        const [response] = await install.isInstalled();

        expect(response).toEqual({
            data: {
                security: {
                    version: null
                }
            }
        });
    });

    test(`should run "install" successfully`, async () => {
        const [installResponse] = await install.install();

        expect(installResponse).toEqual({
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
        const [reinstallResponse] = await install.install();

        expect(reinstallResponse).toEqual({
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
        const [isInstalledResponse] = await install.isInstalled();

        expect(isInstalledResponse).toEqual({
            data: {
                security: {
                    version: expect.any(String)
                }
            }
        });

        // There have to be 2 groups installed
        const [groupsResponse] = await securityGroup.list();
        expect(groupsResponse).toEqual({
            data: {
                security: {
                    listGroups: {
                        data: [
                            {
                                description: "Grants full access to all apps.",
                                name: "Full Access",
                                permissions: [
                                    {
                                        name: "*"
                                    }
                                ],
                                slug: "full-access"
                            },
                            {
                                description: "Permissions for anonymous users (public access).",
                                name: "Anonymous",
                                permissions: [],
                                slug: "anonymous"
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });
});
