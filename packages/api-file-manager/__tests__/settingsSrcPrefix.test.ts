import { describe } from "vitest";
import { expect } from "vitest";
import { test } from "vitest";
import { PublicUrl } from "@webiny/api-core/features/publicUrls/index.js";
import { PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";
import useGqlHandler from "~tests/utils/useGqlHandler";

const SRC_PREFIX_FIELDS = /* GraphQL */ `
    data {
        srcPrefix
        defaultSrcPrefix
    }
    error {
        message
    }
`;

const GET_SRC_PREFIX = /* GraphQL */ `
    query GetSrcPrefix {
        fileManager {
            getSettings {
                ${SRC_PREFIX_FIELDS}
            }
        }
    }
`;

const UPDATE_SRC_PREFIX = /* GraphQL */ `
    mutation UpdateSrcPrefix($data: FmSettingsInput) {
        fileManager {
            updateSettings(data: $data) {
                ${SRC_PREFIX_FIELDS}
            }
        }
    }
`;

describe("File Manager settings: srcPrefix over GraphQL", () => {
    const { invoke } = useGqlHandler({
        identity: { id: "a", type: "test", displayName: "A" },
        plugins: [
            (container: any) => {
                container.registerInstance(PublicUrls, {
                    getApiUrl: async () => PublicUrl.from("https://api.example.com"),
                    getAdminUrl: async () => PublicUrl.unknown()
                });
            }
        ]
    });

    const getSettings = async () => {
        const [body] = await invoke({ body: { query: GET_SRC_PREFIX } });
        return body.data.fileManager.getSettings;
    };

    const updateSettings = async (data: Record<string, unknown>) => {
        const [body] = await invoke({ body: { query: UPDATE_SRC_PREFIX, variables: { data } } });
        return body.data.fileManager.updateSettings;
    };

    test("returns the default alongside the prefix in effect, and accepts an empty prefix", async () => {
        const defaults = {
            srcPrefix: "https://api.example.com/files/",
            defaultSrcPrefix: "https://api.example.com/files/"
        };

        expect(await getSettings()).toEqual({ data: defaults, error: null });

        expect(await updateSettings({ srcPrefix: "https://cdn.example.com/files" })).toEqual({
            data: {
                srcPrefix: "https://cdn.example.com/files/",
                defaultSrcPrefix: "https://api.example.com/files/"
            },
            error: null
        });

        expect(await updateSettings({ srcPrefix: "" })).toEqual({ data: defaults, error: null });
        expect(await getSettings()).toEqual({ data: defaults, error: null });
    });
});
