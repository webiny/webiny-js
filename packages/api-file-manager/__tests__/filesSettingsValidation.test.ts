import { describe, test, expect } from "vitest";
import useGqlHandler from "~tests/utils/useGqlHandler";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

const identityA: IdentityData = {
    id: "a",
    type: "test",
    displayName: "Aa"
};

const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateSettings($data: FmSettingsInput) {
        fileManager {
            updateSettings(data: $data) {
                data {
                    uploadMinFileSize
                    uploadMaxFileSize
                    srcPrefix
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

describe("Files settings validation test", () => {
    const { invoke } = useGqlHandler({ identity: identityA });

    const updateSettings = async (data: Record<string, any>) => {
        const [response] = await invoke({ body: { query: UPDATE_SETTINGS, variables: { data } } });
        return response.data.fileManager.updateSettings;
    };

    test.each([
        "not a url",
        "cdn.example.com/files",
        "javascript:alert(1)",
        "ftp://cdn.example.com/files",
        "//cdn.example.com/files"
    ])(`"srcPrefix" rejects "%s"`, async srcPrefix => {
        const result = await updateSettings({ srcPrefix });
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("FileManager/Settings/ValidationError");
        expect(Object.keys(result.error.data.invalidFields)).toEqual(["srcPrefix"]);
    });

    test(`"srcPrefix" accepts an http(s) URL and adds a trailing slash`, async () => {
        const result = await updateSettings({ srcPrefix: "https://cdn.example.com/files" });
        expect(result.error).toBeNull();
        expect(result.data.srcPrefix).toBe("https://cdn.example.com/files/");
    });

    test(`partial update keeps the stored "srcPrefix"`, async () => {
        await updateSettings({ srcPrefix: "https://cdn.example.com/files/" });
        const result = await updateSettings({ uploadMaxFileSize: 5000 });
        expect(result.error).toBeNull();
        expect(result.data.srcPrefix).toBe("https://cdn.example.com/files/");
    });

    test(`"uploadMinFileSize" cannot exceed the upper size limit`, async () => {
        const result = await updateSettings({ uploadMinFileSize: 10737418241 });
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("FileManager/Settings/ValidationError");
        expect(result.error.data.invalidFields.uploadMinFileSize.code).toBe("too_big");
    });

    test(`"uploadMinFileSize" cannot exceed "uploadMaxFileSize" in the same update`, async () => {
        const result = await updateSettings({ uploadMinFileSize: 2000, uploadMaxFileSize: 1000 });
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("FileManager/Settings/ValidationError");
        expect(Object.keys(result.error.data.invalidFields)).toEqual(["uploadMinFileSize"]);
    });

    test(`"uploadMinFileSize" cannot exceed the stored "uploadMaxFileSize"`, async () => {
        const maxResult = await updateSettings({ uploadMaxFileSize: 1000 });
        expect(maxResult.error).toBeNull();

        const result = await updateSettings({ uploadMinFileSize: 2000 });
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("FileManager/Settings/ValidationError");
        expect(Object.keys(result.error.data.invalidFields)).toEqual(["uploadMinFileSize"]);

        const equalResult = await updateSettings({ uploadMinFileSize: 1000 });
        expect(equalResult.error).toBeNull();
        expect(equalResult.data.uploadMinFileSize).toBe(1000);
    });
});
