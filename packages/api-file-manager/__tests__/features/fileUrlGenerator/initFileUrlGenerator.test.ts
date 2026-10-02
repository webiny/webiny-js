import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { initFileUrlGenerator } from "~/features/file/FileUrlGenerator/initFileUrlGenerator.js";
import type { FileUrlGenerator } from "~/features/file/FileUrlGenerator/abstractions.js";

describe("initFileUrlGenerator", () => {
    it("should run init() once per generator, however many URLs are generated", async () => {
        const init = vi.fn(async () => undefined);
        const generator: FileUrlGenerator.Interface = { init, generateUrl: () => "" };

        await Promise.all([initFileUrlGenerator(generator), initFileUrlGenerator(generator)]);
        await initFileUrlGenerator(generator);

        expect(init).toHaveBeenCalledTimes(1);
    });

    it("should run init() separately for each generator", async () => {
        const first = { init: vi.fn(async () => undefined), generateUrl: () => "" };
        const second = { init: vi.fn(async () => undefined), generateUrl: () => "" };

        await initFileUrlGenerator(first);
        await initFileUrlGenerator(second);

        expect(first.init).toHaveBeenCalledTimes(1);
        expect(second.init).toHaveBeenCalledTimes(1);
    });

    it("should try init() again after it failed", async () => {
        const init = vi
            .fn<() => Promise<void>>()
            .mockRejectedValueOnce(new Error("Could not load the settings."))
            .mockResolvedValueOnce(undefined);
        const generator: FileUrlGenerator.Interface = { init, generateUrl: () => "" };

        await expect(initFileUrlGenerator(generator)).rejects.toThrow(
            "Could not load the settings."
        );
        await expect(initFileUrlGenerator(generator)).resolves.toBeUndefined();
        await initFileUrlGenerator(generator);

        expect(init).toHaveBeenCalledTimes(2);
    });

    it("should accept generators without init()", async () => {
        const generator: FileUrlGenerator.Interface = { generateUrl: () => "" };

        await expect(initFileUrlGenerator(generator)).resolves.toBeUndefined();
    });
});
