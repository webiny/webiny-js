import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import type { Context } from "@webiny/api/types.js";
import { createFileUploadModifier, FileUploadModifier } from "~/index.js";
import { createFileNormalizerFromContext } from "~/utils/createFileNormalizerFromContext.js";

const createContext = (container: Container) => {
    return { container } as unknown as Context;
};

describe("upload file normalizer", () => {
    it("should build the default key when no modifier is registered", async () => {
        const normalizer = createFileNormalizerFromContext(createContext(new Container()));

        const file = await normalizer.normalizeFile({
            id: "abc",
            name: "My Photo.png",
            type: "image/png",
            size: 100
        });

        expect(file).toEqual({
            id: "abc",
            key: "abc/MyPhoto.png",
            name: "My Photo.png",
            type: "image/png",
            size: 100
        });
    });

    it("should apply modifiers registered through the package's exports", async () => {
        const container = new Container();
        container.registerInstance(
            FileUploadModifier,
            createFileUploadModifier(({ modifier }) => {
                modifier.setFile(file => ({ ...file, key: `uploads-${file.name}` }));
            })
        );
        const normalizer = createFileNormalizerFromContext(createContext(container));

        const file = await normalizer.normalizeFile({
            id: "abc",
            name: "photo.png",
            type: "image/png",
            size: 100
        });

        expect(file.key).toBe("abc/uploads-photo.png");
    });
});
