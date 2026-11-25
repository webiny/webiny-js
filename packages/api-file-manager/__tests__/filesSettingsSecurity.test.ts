import { describe, test, expect } from "vitest";
import useGqlHandler from "~tests/utils/useGqlHandler";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

const identityA: IdentityData = {
    id: "a",
    type: "test",
    displayName: "Aa"
};

type IdentityPermissions = Array<[SecurityPermission[], IdentityData | null]>;

const NOT_AUTHORIZED_RESPONSE = {
    data: {
        fileManager: {
            updateSettings: {
                data: null,
                error: {
                    code: "FileManager/Settings/NotAuthorizedError",
                    data: null,
                    message: "Not authorized."
                }
            }
        }
    }
};

describe("Files settings security test", () => {
    test(`"updateSettings" requires the "fm.settings" permission`, async () => {
        const insufficientPermissions: IdentityPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "fm.file" }], identityA],
            [[{ name: "fm.file", rwd: "rwd" }], identityA]
        ];

        for (const [permissions, identity] of insufficientPermissions) {
            const { updateSettings } = useGqlHandler({ permissions, identity });
            const [response] = await updateSettings({
                data: { uploadMaxFileSize: 1000 }
            });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE);
        }

        // Rejected updates must not change the stored settings.
        const { getSettings } = useGqlHandler({ identity: identityA });
        const [getSettingsResponse] = await getSettings();
        expect(getSettingsResponse.data.fileManager.getSettings.data.uploadMaxFileSize).toBe(
            10737418240
        );
    });

    test(`"updateSettings" passes with "fm.settings", "fm.*" or full access`, async () => {
        const sufficientPermissions: IdentityPermissions = [
            [[{ name: "fm.settings" }], identityA],
            [[{ name: "fm.*" }], identityA],
            [[{ name: "*" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { updateSettings } = useGqlHandler({ permissions, identity });
            const uploadMaxFileSize = 1000 + i;
            const [response] = await updateSettings({
                data: { uploadMaxFileSize }
            });
            expect(response).toEqual({
                data: {
                    fileManager: {
                        updateSettings: {
                            data: {
                                uploadMinFileSize: 0,
                                uploadMaxFileSize
                            },
                            error: null
                        }
                    }
                }
            });
        }
    });
});
