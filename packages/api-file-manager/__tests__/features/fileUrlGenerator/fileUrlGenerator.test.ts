import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { FileUrlGenerator } from "~/features/file/FileUrlGenerator/abstractions.js";
import { FileUrlGeneratorFeature } from "~/features/file/FileUrlGenerator/feature.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import type { File } from "~/domain/file/types.js";

const createMockFile = (key: string): File => ({
    id: "file-1",
    key,
    name: "image.jpg",
    type: "image/jpeg",
    size: 1024,
    tags: [],
    createdOn: "2026-01-01T00:00:00.000Z",
    modifiedOn: "2026-01-01T00:00:00.000Z",
    createdBy: { id: "user-1", displayName: "Test", type: "admin" },
    modifiedBy: { id: "user-1", displayName: "Test", type: "admin" },
    savedOn: "2026-01-01T00:00:00.000Z",
    savedBy: { id: "user-1", displayName: "Test", type: "admin" },
    meta: {},
    aliases: [],
    location: { folderId: "root" }
});

describe("FileUrlGenerator", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
    });

    it("should return srcPrefix + file.key after init()", async () => {
        container.registerInstance(GetSettingsUseCase, {
            execute: async () => ({
                isFail: () => false,
                value: { srcPrefix: "https://cdn.example.com/files/" }
            })
        } as any);

        FileUrlGeneratorFeature.register(container);

        const generator = container.resolve(FileUrlGenerator);
        await generator.init!();

        const url = generator.generateUrl(createMockFile("abc123/image.jpg"));

        expect(url).toBe("https://cdn.example.com/files/abc123/image.jpg");
    });

    it("should return only file.key when init() is not called", () => {
        container.registerInstance(GetSettingsUseCase, {
            execute: async () => ({
                isFail: () => false,
                value: { srcPrefix: "https://cdn.example.com/files/" }
            })
        } as any);

        FileUrlGeneratorFeature.register(container);

        const generator = container.resolve(FileUrlGenerator);

        const url = generator.generateUrl(createMockFile("abc123/image.jpg"));

        expect(url).toBe("abc123/image.jpg");
    });

    it("should return the same instance (singleton scope)", () => {
        container.registerInstance(GetSettingsUseCase, {
            execute: async () => ({
                isFail: () => false,
                value: { srcPrefix: "" }
            })
        } as any);

        FileUrlGeneratorFeature.register(container);

        const first = container.resolve(FileUrlGenerator);
        const second = container.resolve(FileUrlGenerator);
        expect(first).toBe(second);
    });

    it("should preserve srcPrefix across resolves because of singleton scope", async () => {
        container.registerInstance(GetSettingsUseCase, {
            execute: async () => ({
                isFail: () => false,
                value: { srcPrefix: "https://cdn.example.com/files/" }
            })
        } as any);

        FileUrlGeneratorFeature.register(container);

        const generator1 = container.resolve(FileUrlGenerator);
        await generator1.init!();

        const generator2 = container.resolve(FileUrlGenerator);
        const url = generator2.generateUrl(createMockFile("abc123/image.jpg"));

        expect(url).toBe("https://cdn.example.com/files/abc123/image.jpg");
    });

    it("should fall back to empty srcPrefix when settings have no srcPrefix", async () => {
        container.registerInstance(GetSettingsUseCase, {
            execute: async () => ({
                isFail: () => false,
                value: null
            })
        } as any);

        FileUrlGeneratorFeature.register(container);

        const generator = container.resolve(FileUrlGenerator);
        await generator.init!();

        const url = generator.generateUrl(createMockFile("abc123/image.jpg"));

        expect(url).toBe("abc123/image.jpg");
    });
});
