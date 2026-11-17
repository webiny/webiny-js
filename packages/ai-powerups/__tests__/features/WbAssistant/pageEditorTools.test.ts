import { describe, it, expect } from "vitest";
import type { ComponentManifest, Document } from "@webiny/website-builder-sdk";
import { createPageEditorTools } from "~/admin/presentation/WbAssistant/pageEditorTools.js";
import type { PageEditorAccess } from "~/admin/presentation/WbAssistant/pageEditorTools.js";
import { outlineLines, pageOutline } from "~/admin/presentation/WbAssistant/pageOutline.js";

type Elements = Document["elements"];

const manifest = (name: string, extra: Partial<ComponentManifest> = {}): ComponentManifest => ({
    name,
    label: name,
    inputs: [{ type: "text", name: "title" }] as ComponentManifest["inputs"],
    tags: [],
    ...extra
});

const COMPONENTS: Record<string, ComponentManifest> = {
    "Webiny/Lexical": manifest("Webiny/Lexical"),
    "Webiny/Grid": manifest("Webiny/Grid"),
    "Acme/Hidden": manifest("Acme/Hidden", { useInAiContentGeneration: false })
};

/**
 * An editor that keeps elements in a map. `refuse` names components the "constraints" reject, the
 * way the real CreateElement command quietly adds nothing.
 */
const fakeEditor = (refuse: string[] = []) => {
    let next = 1;
    const elements: Elements = {
        root: { type: "Webiny/Element", id: "root", component: { name: "Root" } }
    };
    const updates: { id: string; inputs: Record<string, unknown> }[] = [];
    const created: unknown[] = [];

    const access: PageEditorAccess = {
        components: () => COMPONENTS,
        document: () => ({ elements, bindings: {} }),
        createElement: async params => {
            created.push(params);
            if (refuse.includes(params.componentName)) {
                return;
            }
            const id = `el${next++}`;
            elements[id] = {
                type: "Webiny/Element",
                id,
                component: { name: params.componentName },
                parent: { id: params.parentId, slot: params.slot }
            };
        },
        updateInputs: (id, inputs) => updates.push({ id, inputs }),
        moveElement: async ({ elementId, parentId, slot }) => {
            elements[elementId] = { ...elements[elementId], parent: { id: parentId, slot } };
        },
        deleteElement: async id => {
            delete elements[id];
        },
        readInputs: () => ({ title: "Hello" }),
        // Stands in for the envelope pipeline: marks what it resolved.
        resolveValues: async value => ({ ...(value as object), resolved: true }),
        valueTools: () => [
            { name: "textToLexical", description: "HTML to Lexical", inputSchema: {} }
        ]
    };

    const tools = createPageEditorTools(access);
    const run = (name: string, input: unknown) => {
        const tool = tools.find(candidate => candidate.name === name)!;
        return tool.execute(input);
    };

    return { run, elements, updates, created };
};

describe("page editor tools", () => {
    it("lists the components the generator may use, with the value tools and rules", async () => {
        const { run } = fakeEditor();

        const result = (await run("listPageComponents", {})) as {
            components: { name: string }[];
            valueTools: { name: string }[];
            rules: string;
        };

        expect(result.components.map(component => component.name)).toEqual([
            "Webiny/Lexical",
            "Webiny/Grid"
        ]);
        expect(result.valueTools.map(tool => tool.name)).toEqual(["textToLexical"]);
        expect(result.rules).toContain("CreateElement");
    });

    it("adds elements to the page in order, with resolved inputs, and names them", async () => {
        const { run, created } = fakeEditor();

        const result = await run("addPageElements", {
            elements: [
                { component: "Webiny/Lexical", inputs: { title: "Hero" } },
                { component: "Webiny/Grid" }
            ]
        });

        expect(result).toEqual({
            added: [
                { id: "el1", component: "Webiny/Lexical" },
                { id: "el2", component: "Webiny/Grid" }
            ]
        });
        expect(created[0]).toMatchObject({
            componentName: "Webiny/Lexical",
            parentId: "root",
            slot: "children",
            bindings: { inputs: { title: "Hero", resolved: true } }
        });
    });

    it("refuses an unknown component before changing anything", async () => {
        const { run, created } = fakeEditor();

        await expect(
            run("addPageElements", {
                elements: [{ component: "Webiny/Lexical" }, { component: "Webiny/Hero" }]
            })
        ).rejects.toThrow('There is no component named "Webiny/Hero"');
        expect(created).toHaveLength(0);
    });

    it("says which element the editor would not place, and how many went in before it", async () => {
        const { run } = fakeEditor(["Webiny/Grid"]);

        await expect(
            run("addPageElements", {
                elements: [{ component: "Webiny/Lexical" }, { component: "Webiny/Grid" }]
            })
        ).rejects.toThrow(
            '"Webiny/Grid" can\'t go in the "children" slot of "root". 1 element(s) before it were added.'
        );
    });

    it("updates only the inputs sent, after resolving them", async () => {
        const { run, updates } = fakeEditor();
        await run("addPageElements", { elements: [{ component: "Webiny/Lexical" }] });

        await run("updatePageElement", { elementId: "el1", inputs: { title: "New" } });

        expect(updates).toEqual([{ id: "el1", inputs: { title: "New", resolved: true } }]);
    });

    it("refuses to change an element that is not on the page", async () => {
        const { run } = fakeEditor();

        await expect(
            run("updatePageElement", { elementId: "nope", inputs: { title: "x" } })
        ).rejects.toThrow('There is no element "nope" on the page.');
    });

    it("deletes elements and reports them", async () => {
        const { run, elements } = fakeEditor();
        await run("addPageElements", { elements: [{ component: "Webiny/Lexical" }] });

        const result = await run("deletePageElements", { elementIds: ["el1"] });

        expect(result).toEqual({ deleted: ["el1"] });
        expect(elements["el1"]).toBeUndefined();
    });
});

describe("pageOutline", () => {
    it("lists the page's elements under root in slot order, without globals", () => {
        const elements: Elements = {
            root: { type: "Webiny/Element", id: "root", component: { name: "Root" } },
            b: {
                type: "Webiny/Element",
                id: "b",
                component: { name: "Webiny/Grid" },
                parent: { id: "root", slot: "children" }
            },
            a: {
                type: "Webiny/Element",
                id: "a",
                component: { name: "Webiny/Lexical" },
                parent: { id: "root", slot: "children" }
            },
            c: {
                type: "Webiny/Element",
                id: "c",
                component: { name: "Webiny/GridColumn" },
                parent: { id: "b", slot: "columns.0.children" }
            },
            "$global:Header": {
                type: "Webiny/Element",
                id: "$global:Header",
                component: { name: "Acme/Header" }
            }
        };
        const bindings = {
            root: {
                inputs: { children: { id: "x", type: "slot", list: true, static: ["a", "b"] } }
            }
        } as unknown as Document["bindings"];

        const { elements: tree, truncated } = pageOutline({ elements, bindings });

        expect(outlineLines(tree)).toEqual([
            "a Webiny/Lexical",
            "b Webiny/Grid",
            "  c Webiny/GridColumn in columns.0.children"
        ]);
        expect(truncated).toBe(false);
    });
});
