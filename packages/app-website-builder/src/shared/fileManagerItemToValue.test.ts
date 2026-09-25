import { describe, it, expect } from "vitest";
import { fileManagerItemToValue } from "./fileManagerItemToValue.js";

describe("fileManagerItemToValue", () => {
    it("writes mimeType and image dimensions at the root and in image", () => {
        const value = fileManagerItemToValue({
            id: "file-1",
            src: "https://cdn.test/files/file-1/cat.jpg",
            name: "cat.jpg",
            type: "image/jpeg",
            size: 1234,
            width: 1200,
            height: 800
        });

        expect(value).toEqual({
            id: "file-1",
            src: "https://cdn.test/files/file-1/cat.jpg",
            url: "https://cdn.test/files/file-1/cat.jpg",
            name: "cat.jpg",
            mimeType: "image/jpeg",
            size: 1234,
            width: 1200,
            height: 800,
            image: {
                width: 1200,
                height: 800,
                crop: undefined,
                focalPoint: undefined,
                alt: undefined,
                caption: undefined
            }
        });
    });

    it("prefers the File Manager image metadata for dimensions", () => {
        const value = fileManagerItemToValue({
            id: "file-2",
            src: "https://cdn.test/files/file-2/dog.png",
            name: "dog.png",
            type: "image/png",
            size: 10,
            width: 100,
            height: 100,
            metadata: { image: { width: 640, height: 480, alt: "A dog" } }
        });

        expect(value.width).toBe(640);
        expect(value.height).toBe(480);
        expect(value.image).toMatchObject({ width: 640, height: 480, alt: "A dog" });
    });

    it("leaves dimensions out for non-image files", () => {
        const value = fileManagerItemToValue({
            id: "file-3",
            src: "https://cdn.test/files/file-3/doc.pdf",
            name: "doc.pdf",
            type: "application/pdf",
            size: 99
        });

        expect(value.mimeType).toBe("application/pdf");
        expect(value.width).toBeUndefined();
        expect(value.height).toBeUndefined();
        expect(value.image).toBeUndefined();
    });
});
