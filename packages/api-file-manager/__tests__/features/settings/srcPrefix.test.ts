import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { PublicUrl } from "@webiny/api-core/features/publicUrls/index.js";
import { PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import { UpdateSettingsUseCase } from "~/features/settings/UpdateSettings/abstractions.js";
import { GetSettingsFeature } from "~/features/settings/GetSettings/feature.js";
import { UpdateSettingsFeature } from "~/features/settings/UpdateSettings/feature.js";
import { DefaultSrcPrefixFeature } from "~/features/settings/DefaultSrcPrefix/feature.js";
import { FILE_MANAGER_GENERAL_SETTINGS } from "~/domain/settings/constants.js";

/**
 * A File Manager with an in-memory settings store and an API whose public URL the test can change,
 * the way adding a custom domain or moving a container changes it.
 */
const createFileManager = (initialApiUrl: string | null) => {
    const store = new Map<string, unknown>();
    let apiUrl = initialApiUrl;

    const container = new Container();
    container.registerInstance(KeyValueStore, {
        get: async (key: string) => {
            if (!store.has(key)) {
                return Result.fail(new Error("not found"));
            }
            return Result.ok(store.get(key));
        },
        set: async (key: string, value: unknown) => {
            store.set(key, value);
            return Result.ok();
        }
    } as never);
    container.registerInstance(EventPublisher, { publish: async () => {} } as never);
    container.registerInstance(PublicUrls, {
        getApiUrl: async () => PublicUrl.from(apiUrl),
        getAdminUrl: async () => PublicUrl.unknown()
    });
    DefaultSrcPrefixFeature.register(container);
    GetSettingsFeature.register(container);
    UpdateSettingsFeature.register(container);

    const getSettings = container.resolve(GetSettingsUseCase);
    const updateSettings = container.resolve(UpdateSettingsUseCase);

    return {
        moveApiTo: (url: string) => {
            apiUrl = url;
        },
        storedSrcPrefix: () => {
            const stored = store.get(FILE_MANAGER_GENERAL_SETTINGS) as
                | { srcPrefix?: string }
                | undefined;
            return stored?.srcPrefix;
        },
        srcPrefix: async () => {
            const result = await getSettings.execute();
            return result.value.srcPrefix;
        },
        update: async (input: Parameters<UpdateSettingsUseCase.Interface["execute"]>[0]) => {
            const result = await updateSettings.execute(input);
            return result.value;
        }
    };
};

describe("File Manager srcPrefix", () => {
    it("defaults to the API's current public URL, and follows it when it changes", async () => {
        const fileManager = createFileManager("https://d111.cloudfront.net");

        expect(await fileManager.srcPrefix()).toBe("https://d111.cloudfront.net/files/");

        fileManager.moveApiTo("https://api.example.com");

        expect(await fileManager.srcPrefix()).toBe("https://api.example.com/files/");
    });

    it("stores the default shown in the settings form as no custom prefix", async () => {
        const fileManager = createFileManager("https://d111.cloudfront.net");

        // What the Admin form sends back when only the file sizes were edited.
        await fileManager.update({
            uploadMaxFileSize: 100,
            srcPrefix: "https://d111.cloudfront.net/files/"
        });
        fileManager.moveApiTo("https://api.example.com");

        expect(fileManager.storedSrcPrefix()).toBe("");
        expect(await fileManager.srcPrefix()).toBe("https://api.example.com/files/");
    });

    it("keeps a custom prefix, with a trailing slash, when the API moves", async () => {
        const fileManager = createFileManager("https://d111.cloudfront.net");

        const saved = await fileManager.update({ srcPrefix: "https://cdn.example.com/files" });
        fileManager.moveApiTo("https://api.example.com");

        expect(saved.srcPrefix).toBe("https://cdn.example.com/files/");
        expect(await fileManager.srcPrefix()).toBe("https://cdn.example.com/files/");
    });

    it("keeps a custom prefix through an update that doesn't mention it", async () => {
        const fileManager = createFileManager("https://api.example.com");
        await fileManager.update({ srcPrefix: "https://cdn.example.com/files/" });

        await fileManager.update({ uploadMaxFileSize: 100 });

        expect(await fileManager.srcPrefix()).toBe("https://cdn.example.com/files/");
    });

    it("goes back to the default when the prefix is saved empty", async () => {
        const fileManager = createFileManager("https://api.example.com");
        await fileManager.update({ srcPrefix: "https://cdn.example.com/files/" });

        await fileManager.update({ srcPrefix: "" });

        expect(fileManager.storedSrcPrefix()).toBe("");
        expect(await fileManager.srcPrefix()).toBe("https://api.example.com/files/");
    });

    it("is empty while the API URL is unknown", async () => {
        const fileManager = createFileManager(null);

        expect(await fileManager.srcPrefix()).toBe("");
    });
});
