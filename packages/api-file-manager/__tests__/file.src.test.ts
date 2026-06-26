import { describe, it, expect } from "vitest";
import useGqlHandler from "~tests/utils/useGqlHandler";

const GET_SETTINGS_WITH_SRC_PREFIX = /* GraphQL */ `
    query GetSettings {
        fileManager {
            getSettings {
                data {
                    srcPrefix
                    uploadMinFileSize
                    uploadMaxFileSize
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const UPDATE_SETTINGS_WITH_SRC_PREFIX = /* GraphQL */ `
    mutation UpdateSettings($data: FmSettingsInput) {
        fileManager {
            updateSettings(data: $data) {
                data {
                    srcPrefix
                    uploadMinFileSize
                    uploadMaxFileSize
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

describe("FmFile.src resolver", { timeout: 100_000, retry: 3 }, () => {
    const { createFile, getFile, invoke } = useGqlHandler();

    it("should return full URL (srcPrefix + key) in the src field", async () => {
        const srcPrefix = "https://cdn.example.com/files/";

        const [updateResponse] = await invoke({
            body: {
                query: UPDATE_SETTINGS_WITH_SRC_PREFIX,
                variables: { data: { srcPrefix } }
            }
        });
        expect(updateResponse.data.fileManager.updateSettings.error).toBeNull();
        expect(updateResponse.data.fileManager.updateSettings.data.srcPrefix).toBe(srcPrefix);

        const [settingsResponse] = await invoke({
            body: { query: GET_SETTINGS_WITH_SRC_PREFIX }
        });
        expect(settingsResponse.data.fileManager.getSettings.data.srcPrefix).toBe(srcPrefix);

        const fileKey = "abc123/image.jpg";
        const [createResponse] = await createFile(
            {
                data: {
                    id: "file-src-test",
                    key: fileKey,
                    name: "image.jpg",
                    size: 1024,
                    type: "image/jpeg",
                    tags: []
                }
            },
            ["src"]
        );

        expect(createResponse.data.fileManager.createFile.error).toBeNull();
        const createdFile = createResponse.data.fileManager.createFile.data;
        expect(createdFile.src).toBe(`${srcPrefix}${fileKey}`);

        const [getResponse] = await getFile({ id: "file-src-test" }, ["src"]);
        expect(getResponse.data.fileManager.getFile.error).toBeNull();
        const fetchedFile = getResponse.data.fileManager.getFile.data;
        expect(fetchedFile.src).toBe(`${srcPrefix}${fileKey}`);
    });
});
