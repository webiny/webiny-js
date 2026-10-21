import { describe, expect, it } from "vitest";
import { Container, Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { PublicUrl, PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import { UpdateSettingsUseCase } from "~/features/settings/UpdateSettings/abstractions.js";
import { UpdateSettingsUseCase as UpdateSettingsUseCaseImpl } from "~/features/settings/UpdateSettings/UpdateSettingsUseCase.js";

const updateSrcPrefix = async (apiUrl: string | null, srcPrefix?: string) => {
    const container = new Container();
    container.registerInstance(KeyValueStore, { set: async () => Result.ok() } as any);
    container.registerInstance(EventPublisher, { publish: async () => {} } as any);
    container.registerInstance(GetSettingsUseCase, {
        execute: async () => Result.ok({ uploadMinFileSize: 0, uploadMaxFileSize: 100 })
    } as any);
    container.registerInstance(PublicUrls, {
        getApiUrl: async () => PublicUrl.from(apiUrl),
        getAdminUrl: async () => null
    });
    container.register(UpdateSettingsUseCaseImpl);

    const result = await container.resolve(UpdateSettingsUseCase).execute({ srcPrefix });
    return result.value.srcPrefix;
};

describe("UpdateSettingsUseCase srcPrefix", () => {
    it("defaults to the API's public URL", async () => {
        expect(await updateSrcPrefix("https://api.example.com")).toBe(
            "https://api.example.com/files/"
        );
    });

    it("is empty when the API URL is unknown", async () => {
        expect(await updateSrcPrefix(null)).toBe("");
    });

    it("keeps a given value and adds the trailing slash", async () => {
        expect(
            await updateSrcPrefix("https://api.example.com", "https://cdn.example.com/files")
        ).toBe("https://cdn.example.com/files/");
    });
});
