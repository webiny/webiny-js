import { describe, expect, it } from "vitest";
import { getImageProps } from "./getImageProps.js";
import type { Asset } from "@webiny/website-builder-sdk";

const asset = (overrides: Partial<Asset> = {}): Asset => ({
    id: "1",
    name: "photo.jpg",
    size: 1234,
    type: "image/jpeg",
    src: "https://cdn.test/photo.jpg",
    url: "https://cdn.test/photo.jpg",
    image: { width: 1600, height: 900 },
    ...overrides
});

describe("getImageProps", () => {
    it("returns wrapper + image styles and passes through src and dimensions", () => {
        const props = getImageProps(asset());
        expect(props.src).toBe("https://cdn.test/photo.jpg");
        expect(props.width).toBe(1600);
        expect(props.height).toBe(900);
        expect(props.style.overflow).toBe("hidden");
        expect(props.style.position).toBe("relative");
        expect(props.imgStyle.position).toBe("absolute");
    });

    it("resolves alt from the explicit option first", () => {
        const props = getImageProps(asset({ image: { alt: "stored alt" } }), {
            alt: "explicit alt"
        });
        expect(props.alt).toBe("explicit alt");
    });

    it("falls back to the image's stored alt", () => {
        const props = getImageProps(asset({ image: { alt: "stored alt" } }));
        expect(props.alt).toBe("stored alt");
    });

    it("defaults alt to an empty string", () => {
        expect(getImageProps(asset()).alt).toBe("");
    });

    it("produces a wrapper with the requested aspect ratio", () => {
        const props = getImageProps(asset(), { aspectRatio: 1 });
        expect(props.style.aspectRatio).toBe("1");
    });

    it("offsets the image to reveal a focal-point-shifted crop region", () => {
        const props = getImageProps(
            asset({
                image: {
                    width: 1600,
                    height: 900,
                    focalPoint: { x: 0.9, y: 0.5 }
                }
            }),
            { aspectRatio: 1 }
        );
        expect(parseFloat(props.imgStyle.left as string)).toBeLessThan(0);
    });
});
