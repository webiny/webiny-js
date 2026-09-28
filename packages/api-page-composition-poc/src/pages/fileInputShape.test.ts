import { describe, expect, it } from "vitest";
import { fileInputShapes, fileInputValue, unresolvedFileInputs } from "./fileInputShape.js";

/**
 * Both shapes are taken from real generated components: the corpus was produced under more than one
 * rule and the source is the authority on which one a given component follows.
 */
const OBJECT_READER = `
export default function Gallery({ inputs: { images } }) {
    return images.map(img => (img && img.src && img.src.url
        ? <img src={img.src.url} alt={img.alt || ""} />
        : null));
}
export const manifest = { inputs: [
    { name: "images", factory: "createObjectInput", params: { list: true, fields: [
        { name: "src", factory: "createFileInput", params: { label: "Image" } },
        { name: "alt", factory: "createTextInput", params: { label: "Alt" } }
    ] } }
] };
`;

const VALUE_PASSER = `
export default function Header({ inputs: { logo } }) {
    return <img className="logo-img" src={logo.src} alt={logo.alt || "Logo"} />;
}
export const manifest = { inputs: [
    { name: "logo", factory: "createObjectInput", params: { fields: [
        { name: "src", factory: "createFileInput", params: { label: "Logo Image" } },
        { name: "alt", factory: "createTextInput", params: { label: "Alt" } }
    ] } }
] };
`;

describe("fileInputShapes", () => {
    it("reads object shape when the component dereferences .url", () => {
        expect(fileInputShapes(OBJECT_READER).get("src")).toBe("object");
    });

    it("reads string shape when the component passes the value into src=", () => {
        expect(fileInputShapes(VALUE_PASSER).get("src")).toBe("string");
    });

    it("prefers object when a component does both", () => {
        const both = `${OBJECT_READER}\n{hero.url ? <img src={hero.url} /> : <img src={hero} />}\n{ name: "hero", factory: "createFileInput", params: {} }`;
        expect(fileInputShapes(both).get("hero")).toBe("object");
    });

    it("reports unknown when the source does not show how the value is read", () => {
        // Measured, 18 of 147 file inputs across the corpus assign to a local first, and 16 of those
        // pass it through a normaliser the model wrote. A local can hold arbitrary JavaScript, so the
        // honest answer is that scanning cannot settle it.
        const aliased = `
            const imageSrc = image && image.src ? image.src : "";
            <img src={imageSrc} alt="" />
            { name: "src", factory: "createFileInput", params: {} }
        `;
        expect(fileInputShapes(aliased).get("src")).toBe("unknown");
    });

    it("reports unknown for an input the component never renders", () => {
        const unused = `export const manifest = { inputs: [
            { name: "backgroundImage", factory: "createFileInput", params: {} }
        ] };`;
        expect(fileInputShapes(unused).get("backgroundImage")).toBe("unknown");
    });

    it("binds unknown as the object form, and says which inputs those were", () => {
        const aliased = `
            const logoSrc = resolveUrl(logo.src);
            <img src={logoSrc} />
            { name: "src", factory: "createFileInput", params: {} }
        `;
        const shapes = fileInputShapes(aliased);

        expect(fileInputValue("https://cdn/x.jpg", shapes.get("src")!)).toEqual({
            url: "https://cdn/x.jpg"
        });
        expect(unresolvedFileInputs(shapes)).toEqual(["src"]);
    });

    it("finds nothing when the component declares no file input", () => {
        expect(
            fileInputShapes(`{ name: "title", factory: "createTextInput", params: {} }`).size
        ).toBe(0);
    });
});

describe("fileInputValue", () => {
    it("wraps for an object reader and leaves a string alone for a value passer", () => {
        expect(fileInputValue("https://cdn/x.jpg", "object")).toEqual({ url: "https://cdn/x.jpg" });
        expect(fileInputValue("https://cdn/x.jpg", "string")).toBe("https://cdn/x.jpg");
    });
});
