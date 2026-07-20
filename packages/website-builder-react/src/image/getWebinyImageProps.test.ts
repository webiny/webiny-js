import { describe, expect, it } from "vitest";
import { getWebinyImageProps } from "./getWebinyImageProps.js";
import type { WebinyImageValue } from "@webiny/website-builder-sdk";

const image = (overrides: Partial<WebinyImageValue> = {}): WebinyImageValue => ({
    id: "1",
    name: "photo.jpg",
    size: 1234,
    mimeType: "image/jpeg",
    src: "https://cdn.test/photo.jpg",
    width: 1600,
    height: 900,
    ...overrides
});

describe("getWebinyImageProps", () => {
    it("returns wrapper + image styles and passes through src and dimensions", () => {
        const props = getWebinyImageProps(image());
        expect(props.src).toBe("https://cdn.test/photo.jpg");
        expect(props.width).toBe(1600);
        expect(props.height).toBe(900);
        expect(props.style.overflow).toBe("hidden");
        expect(props.style.position).toBe("relative");
        expect(props.imgStyle.position).toBe("absolute");
    });

    it("resolves alt from the explicit option first", () => {
        const props = getWebinyImageProps(image({ edit: { alt: "stored alt" } }), {
            alt: "explicit alt"
        });
        expect(props.alt).toBe("explicit alt");
    });

    it("falls back to the image's stored alt", () => {
        const props = getWebinyImageProps(image({ edit: { alt: "stored alt" } }));
        expect(props.alt).toBe("stored alt");
    });

    it("defaults alt to an empty string", () => {
        expect(getWebinyImageProps(image()).alt).toBe("");
    });

    it("produces a wrapper with the requested aspect ratio", () => {
        const props = getWebinyImageProps(image(), { aspectRatio: 1 });
        expect(props.style.aspectRatio).toBe("1");
    });

    it("offsets the image to reveal a hotspot-shifted crop region", () => {
        // Square target on a 16:9 image, hotspot near the right edge — the visible
        // window should shift right, i.e. a negative left offset.
        const props = getWebinyImageProps(
            image({ edit: { hotspot: { x: 0.9, y: 0.5, width: 0.2, height: 0.2 } } }),
            { aspectRatio: 1 }
        );
        expect(parseFloat(props.imgStyle.left as string)).toBeLessThan(0);
    });
});
