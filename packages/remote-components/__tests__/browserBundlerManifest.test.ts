import { describe, it, expect } from "vitest";
import { transformManifestSource } from "~/admin/bundler/browserBundler.js";

const source = `
export const manifest = {
    name: "Custom/TestimonialsSlider",
    label: "Testimonials Slider",
    inputs: [
        { name: "title", factory: "createTextInput", params: { label: "Section Title" } },
        { name: "testimonials", factory: "createObjectInput", params: { list: true, label: "Testimonials", fields: [
            { name: "quote", factory: "createLongTextInput", params: { label: "Quote" } },
            { name: "author", factory: "createObjectInput", params: { label: "Author", fields: [
                { name: "name", factory: "createTextInput", params: { label: "Name" } },
                { name: "avatar", factory: "createFileInput", params: { label: "Avatar", allowedFileTypes: ["image/*"] } },
                { name: "social", factory: "createObjectInput", params: { label: "Social", fields: [
                    { name: "url", factory: "createTextInput", params: { label: "URL" } }
                ] } }
            ] } }
        ] } }
    ]
};

export default function TestimonialsSlider() {
    return null;
}
`;

const factory = (renderer: string) => (params: Record<string, any>) => ({ renderer, ...params });

const evaluateManifest = (manifestSource: string) => {
    const fn = new Function(
        "createTextInput",
        "createLongTextInput",
        "createFileInput",
        "createObjectInput",
        `return (${manifestSource});`
    );
    return fn(factory("text"), factory("longText"), factory("file"), factory("object"));
};

describe("browser bundler manifest", () => {
    it("turns input entries into factory calls at every nesting level", () => {
        const manifest = evaluateManifest(transformManifestSource(source));

        const [title, testimonials] = manifest.inputs;
        expect(title).toMatchObject({ renderer: "text", name: "title" });
        expect(testimonials).toMatchObject({
            renderer: "object",
            name: "testimonials",
            list: true
        });

        const [quote, author] = testimonials.fields;
        expect(quote).toMatchObject({ renderer: "longText", name: "quote" });
        // The case that broke: an object inside a list object. Its fields came through as raw
        // `{ name, factory, params }` literals, with no renderer.
        expect(author).toMatchObject({ renderer: "object", name: "author" });
        expect(author.fields.map((f: any) => [f.name, f.renderer])).toEqual([
            ["name", "text"],
            ["avatar", "file"],
            ["social", "object"]
        ]);
        expect(author.fields[1].allowedFileTypes).toEqual(["image/*"]);
        expect(author.fields[2].fields[0]).toMatchObject({ renderer: "text", name: "url" });
    });
});
