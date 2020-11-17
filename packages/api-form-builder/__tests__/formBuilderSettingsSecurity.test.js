import { SecurityIdentity } from "@webiny/api-security";
import useGqlHandler from "./useGqlHandler";

const NOT_AUTHORIZED_RESPONSE = operation => ({
    data: {
        forms: {
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

const identityA = new SecurityIdentity({
    id: "a",
    login: "a",
    type: "test",
    displayName: "Aa"
});

const identityB = new SecurityIdentity({
    id: "b",
    login: "b",
    type: "test",
    displayName: "Bb"
});

const defaultHandler = useGqlHandler({
    permissions: [{ name: "content.i18n" }, { name: "forms.*" }],
    identity: identityA
});

beforeEach(async () => {
    try {
        await defaultHandler.elasticSearch.indices.create({ index: "form-builder" });
    } catch (e) {}
});

afterEach(async () => {
    try {
        await defaultHandler.elasticSearch.indices.delete({ index: "form-builder" });
    } catch (e) {}
});

describe("Form Builder Settings Security Test", () => {
    test(`allow "updateSettings" if identity has sufficient permissions`, async () => {
        const { install } = defaultHandler;
        // Let's install the "Form Builder" app first.
        await install({ domain: "localhost:5000" });

        let insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "forms.forms" }], identityA]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            let [permissions, identity] = insufficientPermissions[i];
            const { updateSettings } = useGqlHandler({ permissions, identity });
            let [response] = await updateSettings();
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("updateSettings"));
        }

        let sufficientPermissions = [
            [[{ name: "content.i18n" }, { name: "forms.*" }], identityA],
            [[{ name: "content.i18n" }, { name: "forms.settings" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            let [permissions, identity] = sufficientPermissions[i];
            const { updateSettings } = useGqlHandler({ permissions, identity });
            let [response] = await updateSettings({ data: { domain: "localhost:3000" } });
            expect(response).toMatchObject({
                data: {
                    forms: {
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
    });

    test(`allow "getSettings" if identity has sufficient permissions`, async () => {
        const { install } = defaultHandler;
        // Let's install the "Form Builder" app first.
        await install({ domain: "localhost:5000" });

        let insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "forms.forms" }], identityA]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            let [permissions, identity] = insufficientPermissions[i];
            const { getSettings } = useGqlHandler({ permissions, identity });
            let [response] = await getSettings();
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("getSettings"));
        }

        let sufficientPermissions = [
            [[{ name: "content.i18n" }, { name: "forms.*" }], identityA],
            [[{ name: "content.i18n" }, { name: "forms.settings" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            let [permissions, identity] = sufficientPermissions[i];
            const { getSettings } = useGqlHandler({ permissions, identity });
            let [response] = await getSettings();
            expect(response).toMatchObject({
                data: {
                    forms: {
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
    });
});
