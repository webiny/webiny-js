import useGqlHandler from "./useGqlHandler";
import { SecurityIdentity } from "@webiny/api-security/types";
import { IdentityPermissions } from "./types";

const NOT_AUTHORIZED_RESPONSE = (operation: string) => ({
    data: {
        formBuilder: {
            [operation]: {
                data: null,
                error: {
                    code: "SECURITY_NOT_AUTHORIZED",
                    data: null,
                    message: "Not authorized!"
                }
            }
        }
    }
});

describe("Form Builder Settings Security Test", () => {
    const identityA: SecurityIdentity = {
        id: "a",
        type: "test",
        displayName: "Aa"
    };

    const defaultHandler = useGqlHandler({
        permissions: [{ name: "content.i18n" }, { name: "fb.*" }],
        identity: identityA
    });

    beforeEach(async () => {
        await defaultHandler.install({ domain: "localhost:5000" });
    });

    const insufficientUpdatePermissions: IdentityPermissions = [
        [[], null],
        [[], identityA],
        [[{ name: "forms.forms" }], identityA]
    ];

    test.each(insufficientUpdatePermissions)(
        `should forbid "updateSettings" with %j and %j`,
        async (permissions, identity) => {
            const { updateSettings } = useGqlHandler({
                permissions,
                identity
            });
            const [response] = await updateSettings();
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("updateSettings"));
        }
    );

    const sufficientUpdatePermissions: IdentityPermissions = [
        [[{ name: "content.i18n" }, { name: "fb.*" }], identityA],
        [[{ name: "content.i18n" }, { name: "fb.settings" }], identityA]
    ];

    test.each(sufficientUpdatePermissions)(
        `should allow "updateSettings" with sufficient permissions`,
        async (permissions, identity) => {
            const { updateSettings } = useGqlHandler({ permissions, identity });
            const [response] = await updateSettings({ data: { domain: "localhost:3000" } });
            expect(response).toMatchObject({
                data: {
                    formBuilder: {
                        updateSettings: {
                            data: {
                                domain: "localhost:3000",
                                reCaptcha: {
                                    enabled: null,
                                    secretKey: null,
                                    siteKey: null
                                }
                            },
                            error: null
                        }
                    }
                }
            });
        }
    );

    const insufficientGetPermissions: IdentityPermissions = [
        [[], null],
        [[], identityA],
        [[{ name: "forms.forms" }], identityA]
    ];

    test.each(insufficientGetPermissions)(
        `should forbid "getSettings" with %j and %j`,
        async (permissions, identity) => {
            const { install } = defaultHandler;
            // Let's install the "Form Builder" app first.
            await install({ domain: "localhost:5000" });

            const { getSettings } = useGqlHandler({ permissions, identity });
            const [response] = await getSettings();
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("getSettings"));
        }
    );

    const sufficientGetPermissions: IdentityPermissions = [
        [[{ name: "content.i18n" }, { name: "fb.*" }], identityA],
        [[{ name: "content.i18n" }, { name: "fb.settings" }], identityA]
    ];

    test.each(sufficientGetPermissions)(
        `should allow "getSettings" with %j and %j`,
        async (permissions, identity) => {
            const { install } = defaultHandler;
            // Let's install the "Form Builder" app first.
            await install({ domain: "localhost:5000" });

            const { getSettings } = useGqlHandler({ permissions, identity });
            const [response] = await getSettings();
            expect(response).toMatchObject({
                data: {
                    formBuilder: {
                        getSettings: {
                            data: {
                                domain: "localhost:5000",
                                reCaptcha: {
                                    enabled: null,
                                    secretKey: null,
                                    siteKey: null
                                }
                            },
                            error: null
                        }
                    }
                }
            });
        }
    );
});
