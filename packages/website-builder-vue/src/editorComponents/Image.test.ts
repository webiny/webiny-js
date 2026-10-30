import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, it, expect } from "vitest";
import { ImageComponent } from "./Image.js";

type ImageProps = InstanceType<typeof ImageComponent>["$props"];

// Fixtures cover partial and legacy values, which the component's input type doesn't describe.
const render = (inputs: Record<string, unknown>, styles: Record<string, unknown> = {}) => {
    const props = { inputs, styles } as unknown as ImageProps;
    return renderToString(createSSRApp({ render: () => h(ImageComponent, props) }));
};

describe("Webiny/Image", () => {
    it("renders a responsive image with crop, format and the cropped dimensions", async () => {
        const html = await render({
            title: "Cat",
            altText: "",
            image: {
                id: "1",
                name: "cat.jpg",
                size: 100,
                mimeType: "image/jpeg",
                src: "https://cdn.test/files/1/cat.jpg",
                image: {
                    width: 2000,
                    height: 1000,
                    alt: "A cat",
                    crop: { left: 0.25, right: 0.25, top: 0, bottom: 0 }
                }
            }
        });

        expect(html).toContain('alt="A cat"');
        expect(html).toContain('width="1000"');
        expect(html).toContain('height="1000"');
        expect(html).toContain("crop=");
        expect(html).toContain("format=auto");
        expect(html).toContain("width=3840&amp;format=auto 3840w");
        expect(html).toContain('loading="lazy"');
    });

    it("does not put renderer props on the image as attributes", async () => {
        const html = await renderToString(
            createSSRApp({
                render: () =>
                    h(ImageComponent, {
                        inputs: { image: { src: "https://cdn.test/a.jpg" } },
                        styles: {},
                        breakpoint: "desktop"
                    } as unknown as ImageProps)
            })
        );

        expect(html).not.toContain("breakpoint");
    });

    it("renders a legacy flat value saved by 6.4", async () => {
        const html = await render({
            title: "Dog",
            altText: "Dog",
            image: {
                id: "2",
                name: "dog.png",
                size: 100,
                mimeType: "image/png",
                src: "https://cdn.test/files/2/dog.png",
                width: 800,
                height: 600
            }
        });

        expect(html).toContain('src="https://cdn.test/files/2/dog.png?');
        expect(html).toContain('alt="Dog"');
        expect(html).toContain('title="Dog"');
    });

    it("trims the srcset for a fixed CSS width and loads eagerly with high priority", async () => {
        const html = await render(
            {
                highPriority: true,
                image: { src: "https://cdn.test/files/3/a.jpg", image: { width: 400, height: 400 } }
            },
            { width: "150px" }
        );

        expect(html).toContain("width=384&amp;format=auto 384w");
        expect(html).not.toContain("640w");
        expect(html).toContain('loading="eager"');
        expect(html).toContain('fetchpriority="high"');
    });

    it("renders SVGs as an object and a placeholder when there is no image", async () => {
        const svg = await render({ title: "Logo", image: { src: "https://cdn.test/logo.svg" } });
        expect(svg).toContain("<object");
        expect(svg).toContain('data="https://cdn.test/logo.svg"');

        const empty = await render({});
        expect(empty).toContain("<svg");
        expect(empty).not.toContain("<img");
    });
});
