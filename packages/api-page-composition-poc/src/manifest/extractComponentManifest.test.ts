import { describe, expect, it } from "vitest";
import { extractComponentManifest } from "./extractComponentManifest.js";

const source = (manifest: string): string => `
export default function Hero({ title }) {
    return null;
}

export const manifest = ${manifest};
`;

describe("extractComponentManifest", () => {
    it("builds inputs from the declarative factory descriptors", () => {
        const manifest = extractComponentManifest(
            source(`{
    name: "Custom/Hero",
    label: "Hero",
    inputs: [
        { name: "title", factory: "createTextInput", params: { label: "Title", defaultValue: "Hi" } },
        { name: "count", factory: "createNumberInput", params: { label: "Count" } }
    ]
}`),
            "Custom/Hero"
        );

        expect(manifest.inputs).toHaveLength(2);
        expect(manifest.inputs[0]).toMatchObject({
            name: "title",
            type: "text",
            label: "Title",
            defaultValue: "Hi"
        });
        expect(manifest.inputs[1]).toMatchObject({ name: "count", type: "number" });
    });

    it("recurses into nested object fields", () => {
        const manifest = extractComponentManifest(
            source(`{
    name: "Custom/Cards",
    inputs: [
        { name: "cards", factory: "createObjectInput", params: { list: true, label: "Cards", fields: [
            { name: "title", factory: "createTextInput", params: { label: "Title" } },
            { name: "body", factory: "createLongTextInput", params: { label: "Body" } }
        ] } }
    ]
}`),
            "Custom/Cards"
        );

        const cards = manifest.inputs[0] as { type: string; list?: boolean; fields?: unknown[] };
        expect(cards.type).toBe("object");
        expect(cards.list).toBeTrue();
        expect(cards.fields).toHaveLength(2);
        expect(cards.fields?.[0]).toMatchObject({ name: "title", type: "text" });
    });

    it("carries defaults through", () => {
        const manifest = extractComponentManifest(
            source(`{
    name: "Custom/Hero",
    inputs: [{ name: "title", factory: "createTextInput", params: { label: "Title" } }],
    defaults: { inputs: { title: "Welcome" } }
}`),
            "Custom/Hero"
        );

        expect(manifest.defaults?.inputs).toEqual({ title: "Welcome" });
    });

    it("uses the promoted name, not the name the model wrote", () => {
        const manifest = extractComponentManifest(
            source(`{
    name: "Custom/Hero",
    inputs: [{ name: "title", factory: "createTextInput", params: { label: "Title" } }]
}`),
            "Custom/Hero 2"
        );

        expect(manifest.name).toBe("Custom/Hero 2");
    });

    it("drops a descriptor naming a factory that does not exist", () => {
        const manifest = extractComponentManifest(
            source(`{
    name: "Custom/Hero",
    inputs: [
        { name: "title", factory: "createTextInput", params: { label: "Title" } },
        { name: "mystery", factory: "createQuantumInput", params: { label: "?" } }
    ]
}`),
            "Custom/Hero"
        );

        expect(manifest.inputs).toHaveLength(1);
        expect(manifest.inputs[0]).toMatchObject({ name: "title" });
    });

    it("fails loudly when there is no manifest to read", () => {
        expect(() =>
            extractComponentManifest("export default function Hero() {}", "Custom/Hero")
        ).toThrowError(/Could not find a manifest/);
    });

    it("fails loudly when the manifest is not a valid literal", () => {
        const broken = source(`{
    name: ,
}`);
        expect(() => extractComponentManifest(broken, "Custom/Hero")).toThrowError(
            /not a valid object literal/
        );
    });
});
