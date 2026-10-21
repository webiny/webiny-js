import { describe, it, expect } from "vitest";
import type { GlobalDocument } from "@webiny/website-builder-sdk";
import { OverrideLayers, splitStoredOverrides } from "./OverrideLayers.js";

const HEADER = "$global:Demo/Header";

const input = (value: string) => ({ id: `id-${value}`, type: "text", static: value });

const headerRecord = (): GlobalDocument => ({
    elements: {
        [HEADER]: { type: "Webiny/Element", id: HEADER, component: { name: "Demo/Header" } }
    },
    bindings: {
        [HEADER]: { inputs: { title: input("Global title"), tagline: input("Global tagline") } }
    }
});

// A stored page: a placement of the header, its own hero, and its overrides.
const storedPage = (): GlobalDocument => ({
    elements: {
        root: { type: "Webiny/Element", id: "root", component: { name: "Root" } },
        placement: {
            type: "Webiny/Element",
            id: "placement",
            component: { name: "Demo/Header" },
            parent: { id: "root", slot: "children" }
        }
    },
    bindings: {
        root: { inputs: { children: { id: "c", type: "slot", static: ["placement"] } } },
        // The page's override of the header.
        [HEADER]: { inputs: { title: input("Page title") } },
        // The page's override of the layout's banner.
        banner: { inputs: { text: input("Page banner") } }
    }
});

const createLayers = () => {
    const layoutElementIds = ["banner"];
    const { document, own } = splitStoredOverrides(storedPage(), layoutElementIds);
    const layers = new OverrideLayers({
        records: { [HEADER]: headerRecord() },
        layoutBindings: {
            banner: { inputs: { text: input("Layout banner"), color: input("red") } },
            [HEADER]: { inputs: { tagline: input("Layout tagline") } }
        },
        layoutElementIds,
        own
    });

    const composed = structuredClone(document);
    layers.composeLayoutElements(composed, document.bindings);
    layers.composeGlobal(composed, HEADER);

    return { layers, composed };
};

describe("OverrideLayers", () => {
    it("splits a stored page into its own part and its overrides of globals", () => {
        const { document, own } = splitStoredOverrides(storedPage(), ["banner"]);

        expect(Object.keys(own)).toEqual([HEADER]);
        expect(document.bindings.banner).toBeDefined();
    });

    it("composes a global from its record, the layout's override and the page's override", () => {
        const { composed } = createLayers();

        expect(composed.elements[HEADER]).toBeDefined();
        expect(composed.bindings[HEADER].inputs?.title.static).toBe("Page title");
        expect(composed.bindings[HEADER].inputs?.tagline.static).toBe("Layout tagline");
    });

    it("composes a layout element from the layout with the page's override", () => {
        const { composed } = createLayers();

        expect(composed.bindings.banner.inputs?.text.static).toBe("Page banner");
        expect(composed.bindings.banner.inputs?.color.static).toBe("red");
    });

    it("stores only overrides: no instance, the page's override of the global, what differs from the layout", () => {
        const { layers, composed } = createLayers();
        composed.bindings.banner.inputs!.color = input("blue");

        const stored = layers.toStored(composed);

        expect(stored.elements[HEADER]).toBeUndefined();
        expect(stored.bindings[HEADER]).toEqual({ inputs: { title: input("Page title") } });
        expect(stored.bindings.banner).toEqual({
            inputs: { text: input("Page banner"), color: input("blue") }
        });
        expect(stored.bindings.root).toBeDefined();
    });

    it("keeps a global's unsaved changes out of the stored page until they're saved", () => {
        const { layers, composed } = createLayers();
        composed.bindings[HEADER].inputs!.tagline = input("Edited tagline");

        expect(layers.hasChanges(composed, HEADER)).toBe(true);
        expect(layers.toStored(composed).bindings[HEADER]).toEqual({
            inputs: { title: input("Page title") }
        });

        const saved = layers.withOwnFor(
            composed,
            HEADER,
            layers.getDocumentOverrides(composed, HEADER)
        );

        expect(saved.hasChanges(composed, HEADER)).toBe(false);
        expect(saved.toStored(composed).bindings[HEADER]).toEqual({
            inputs: { title: input("Page title"), tagline: input("Edited tagline") }
        });
    });

    it("saves a global's unsaved changes on top of its record, without the page's overrides", () => {
        const { layers, composed } = createLayers();
        composed.bindings[HEADER].inputs!.tagline = input("Edited tagline");

        const record = layers.getEditedRecord(composed, HEADER);

        expect(record.bindings[HEADER].inputs?.title.static).toBe("Global title");
        expect(record.bindings[HEADER].inputs?.tagline.static).toBe("Edited tagline");
        expect(record.elements[HEADER].parent).toBeUndefined();
    });

    it("restores a global's instance, and removes elements added to it since", () => {
        const { layers, composed } = createLayers();
        composed.elements.added = {
            type: "Webiny/Element",
            id: "added",
            component: { name: "Text" },
            parent: { id: HEADER, slot: "children" }
        };
        composed.bindings.added = { inputs: {} };
        composed.bindings[HEADER].inputs!.title = input("Edited");

        expect(layers.hasStructureChanges(composed, HEADER)).toBe(true);

        layers.composeGlobal(composed, HEADER);

        expect(composed.elements.added).toBeUndefined();
        expect(composed.bindings.added).toBeUndefined();
        expect(composed.bindings[HEADER].inputs?.title.static).toBe("Page title");
        expect(layers.hasChanges(composed, HEADER)).toBe(false);
    });
});
