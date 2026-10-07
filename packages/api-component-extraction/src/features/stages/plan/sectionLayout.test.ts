import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import type { CapturedNode } from "~/domain/artifacts.js";
import { measureTone } from "~/features/shared/imageTone.js";
import { sectionImages, sectionLayout } from "./sectionLayout.js";

// Freehill's header as captured from the live site: 70px tall, its logo hanging below it.
const header = JSON.parse(
    readFileSync(new URL("../segment/__fixtures__/freehill-header.json", import.meta.url), "utf8")
) as CapturedNode;

const node = (
    tag: string,
    box: CapturedNode["box"],
    extra: Partial<CapturedNode> = {}
): CapturedNode => ({
    tag,
    box,
    styles: {},
    children: [],
    ...extra
});

describe("sectionLayout", () => {
    it("gives the section's size and its logo's drawn size and place", () => {
        const layout = sectionLayout(header);
        expect(layout).toMatchObject({ width: 1440, height: 70 });
        expect(layout.elements).toEqual([
            {
                kind: "image",
                label: '"Freehill Street Lofts"',
                x: 30,
                y: 15,
                width: 378,
                height: 120
            }
        ]);
    });

    it("counts a carousel's stacked slides once and leaves out what is wholly off the section", () => {
        // Freehill's hero: four slides in one place; an off-canvas spam-trap field.
        const hero = node(
            "div",
            { x: 0, y: 113, width: 1440, height: 648 },
            {
                children: [
                    ...["Apartments", "Swimming pool", "Bedroom", "Kitchen"].map(alt =>
                        node(
                            "img",
                            { x: 0, y: 113, width: 1440, height: 648 },
                            { src: `https://example.com/${alt}.jpg`, alt }
                        )
                    ),
                    node(
                        "h1",
                        { x: 60, y: 380, width: 1320, height: 100 },
                        { text: "Turn the Page to Better Living" }
                    ),
                    node("input", { x: -9954, y: 649, width: 430, height: 50 })
                ]
            }
        );
        const layout = sectionLayout(hero);
        expect(layout.elements.map(element => element.kind)).toEqual(["image", "text"]);
        expect(layout.elements[0].label).toMatch(/^4 stacked in one place \(a carousel/);
        expect(layout.elements[1]).toMatchObject({ x: 60, y: 267 });
    });
});

describe("sectionImages", () => {
    it("names a picture's role by how it is drawn", () => {
        const hero = node(
            "div",
            { x: 0, y: 0, width: 1440, height: 648 },
            {
                children: [
                    node(
                        "img",
                        { x: 0, y: 0, width: 1440, height: 648 },
                        { src: "https://example.com/pool.jpg" }
                    ),
                    node(
                        "img",
                        { x: 30, y: 15, width: 378, height: 120 },
                        { src: "https://example.com/logo.png", alt: "Logo" }
                    )
                ]
            }
        );
        expect(sectionImages(hero).map(image => [image.url.split("/").pop(), image.role])).toEqual([
            ["pool.jpg", "fills-section"],
            ["logo.png", "inline"]
        ]);
    });
});

describe("measureTone", () => {
    it("reads a white logo on a transparent background as light and see-through", async () => {
        const logo = await sharp({
            create: {
                width: 120,
                height: 40,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
            .composite([
                {
                    input: await sharp({
                        create: {
                            width: 60,
                            height: 16,
                            channels: 4,
                            background: { r: 255, g: 255, b: 255, alpha: 1 }
                        }
                    })
                        .png()
                        .toBuffer(),
                    top: 12,
                    left: 30
                }
            ])
            .png()
            .toBuffer();
        expect(await measureTone(logo)).toEqual({ tone: "light", transparent: true, opacity: 0.2 });
    });

    it("reads a dark opaque photograph as dark", async () => {
        const photo = await sharp({
            create: { width: 64, height: 64, channels: 3, background: { r: 30, g: 40, b: 50 } }
        })
            .jpeg()
            .toBuffer();
        expect(await measureTone(photo)).toEqual({ tone: "dark", transparent: false, opacity: 1 });
    });
});
