import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { FileUrlGenerator } from "~/features/file/FileUrlGenerator/abstractions.js";
import { FileUrlPrefixProvider } from "~/features/file/FileUrlGenerator/abstractions.js";
import { FileUrlGeneratorFeature } from "~/features/file/FileUrlGenerator/feature.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import type { File } from "~/domain/file/types.js";

const createContainer = (execute: GetSettingsUseCase.Interface["execute"]) => {
    const container = new Container();
    container.registerInstance(GetSettingsUseCase, { execute });
    FileUrlGeneratorFeature.register(container);
    return container;
};

const createFile = (key: string) => {
    const file: Partial<File> = { key };
    return file as File;
};

const settings = (srcPrefix: string) => {
    return Result.ok({ uploadMinFileSize: 0, uploadMaxFileSize: 1, srcPrefix });
};

describe("FileUrlGenerator", () => {
    it("should put the prefix in front of the file key", async () => {
        const execute = vi.fn(async () => settings("https://cdn.example.com/files/"));
        const generator = createContainer(execute).resolve(FileUrlGenerator);

        const url = await generator.generateUrl(createFile("a/1.png"));

        expect(url).toEqual("https://cdn.example.com/files/a/1.png");
    });

    it("should use a replacement prefix provider", async () => {
        const execute = vi.fn(async () => settings("/from-settings/"));
        const container = createContainer(execute);
        container.registerInstance(FileUrlPrefixProvider, {
            getPrefix: async () => "https://assets.example.com/"
        });
        const generator = container.resolve(FileUrlGenerator);

        const url = await generator.generateUrl(createFile("a/1.png"));

        expect(url).toEqual("https://assets.example.com/a/1.png");
        expect(execute).not.toHaveBeenCalled();
    });
});

describe("SettingsFileUrlPrefixProvider", () => {
    it("should read the settings once, however many prefixes are requested", async () => {
        const execute = vi.fn(async () => settings("/files/"));
        const provider = createContainer(execute).resolve(FileUrlPrefixProvider);

        const [first, second] = await Promise.all([provider.getPrefix(), provider.getPrefix()]);
        const third = await provider.getPrefix();

        expect([first, second, third]).toEqual(["/files/", "/files/", "/files/"]);
        expect(execute).toHaveBeenCalledTimes(1);
    });

    it("should read the settings again after a failed read", async () => {
        const execute = vi
            .fn<GetSettingsUseCase.Interface["execute"]>()
            .mockRejectedValueOnce(new Error("Could not read the settings."))
            .mockResolvedValue(settings("/files/"));
        const provider = createContainer(execute).resolve(FileUrlPrefixProvider);

        const failed = provider.getPrefix();
        await expect(failed).rejects.toThrow("Could not read the settings.");

        const prefix = await provider.getPrefix();
        expect(prefix).toEqual("/files/");
        expect(execute).toHaveBeenCalledTimes(2);
    });

    it("should return an empty prefix when the settings have none", async () => {
        const execute = vi.fn(async () => settings(""));
        const provider = createContainer(execute).resolve(FileUrlPrefixProvider);

        const prefix = await provider.getPrefix();

        expect(prefix).toEqual("");
    });
});
