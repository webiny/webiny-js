import useGqlHandler from "./useGqlHandler";

describe(`Test "Security" install`, () => {
    const { install, securityGroup } = useGqlHandler({ fullAccess: true });

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
        let [response] = await install.install({
            data: { firstName: "first test", lastName: "last test", login: "firstlast@test.com" }
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
            data: { firstName: "first test", lastName: "last test", login: "firstlast@test.com" }
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
                    version: expect.any(String)
                }
            }
        });

        // There have to be 2 groups installed
        [response] = await securityGroup.list();
        const { listGroups: groups } = response.data.security;
        expect(groups.data.length).toBe(2);
        expect(groups.data[0].slug).toBe("anonymous");
        expect(groups.data[1].slug).toBe("full-access");
    });
});
