import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { FileUrlGenerator } from "~/features/file/FileUrlGenerator/abstractions.js";
import { FileUrlGeneratorFeature } from "~/features/file/FileUrlGenerator/feature.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import type { File } from "~/domain/file/types.js";

const createGenerator = (execute: GetSettingsUseCase.Interface["execute"]) => {
    const container = new Container();
    container.registerInstance(GetSettingsUseCase, { execute });
    FileUrlGeneratorFeature.register(container);
    return container.resolve(FileUrlGenerator);
};

const createFile = (key: string) => {
    const file: Partial<File> = { key };
    return file as File;
};

const settings = (srcPrefix: string) => {
    return Result.ok({ uploadMinFileSize: 0, uploadMaxFileSize: 1, srcPrefix });
};

describe("FileUrlGenerator", () => {
    it("should read the settings once, however many URLs it generates", async () => {
        const execute = vi.fn(async () => settings("https://cdn.example.com/files/"));
        const generator = createGenerator(execute);

        const [first, second] = await Promise.all([
            generator.generateUrl(createFile("a/1.png")),
            generator.generateUrl(createFile("b/2.png"))
        ]);
        const third = await generator.generateUrl(createFile("c/3.png"));

        expect(first).toEqual("https://cdn.example.com/files/a/1.png");
        expect(second).toEqual("https://cdn.example.com/files/b/2.png");
        expect(third).toEqual("https://cdn.example.com/files/c/3.png");
        expect(execute).toHaveBeenCalledTimes(1);
    });

    it("should read the settings again after a failed read", async () => {
        const execute = vi
            .fn<GetSettingsUseCase.Interface["execute"]>()
            .mockRejectedValueOnce(new Error("Could not read the settings."))
            .mockResolvedValue(settings("/files/"));
        const generator = createGenerator(execute);
        const file = createFile("a/1.png");

        const failed = generator.generateUrl(file);
        await expect(failed).rejects.toThrow("Could not read the settings.");

        const url = await generator.generateUrl(file);
        expect(url).toEqual("/files/a/1.png");
        expect(execute).toHaveBeenCalledTimes(2);
    });

    it("should return the key alone when there is no srcPrefix", async () => {
        const execute = vi.fn(async () => settings(""));
        const generator = createGenerator(execute);

        const url = await generator.generateUrl(createFile("a/1.png"));

        expect(url).toEqual("a/1.png");
    });
});
