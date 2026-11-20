import { describe, it, expect } from "vitest";
import { StateWithHistory } from "./StateWithHistory.js";

const HEADER = "$global:Demo/Header";

const createState = () => {
    return new StateWithHistory<Record<string, any>>({
        elements: {
            root: { type: "Webiny/Element", id: "root", component: { name: "Root" } },
            [HEADER]: { type: "Webiny/Element", id: HEADER, component: { name: "Demo/Header" } }
        },
        bindings: {
            root: { inputs: {} },
            [HEADER]: { inputs: { title: { static: "Welcome" } } }
        } as Record<string, any>
    });
};

// State updates are committed in a microtask.
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe("StateWithHistory", () => {
    it("does not record changes to global elements", async () => {
        const state = createState();

        state.update(document => {
            document.bindings[HEADER].inputs.title.static = "Changed";
        });
        await flush();

        expect(state.getHistory().getSnapshots()).toHaveLength(1);
    });

    it("keeps global elements as they are on undo and redo", async () => {
        const state = createState();

        state.update(document => {
            document.bindings.root.inputs.color = { static: "red" };
        });
        await flush();

        state.update(document => {
            document.bindings[HEADER].inputs.title.static = "Changed";
        });
        await flush();

        state.undo();
        expect(state.read().bindings.root.inputs.color).toBeUndefined();
        expect(state.read().bindings[HEADER].inputs.title.static).toBe("Changed");

        state.redo();
        expect(state.read().bindings.root.inputs.color).toEqual({ static: "red" });
        expect(state.read().bindings[HEADER].inputs.title.static).toBe("Changed");
    });

    it("undoes placing a global, and keeps its instance", async () => {
        const state = createState();

        state.update(document => {
            document.elements.placement = {
                type: "Webiny/Element",
                id: "placement",
                component: { name: "Demo/Header" },
                parent: { id: "root", slot: "children" }
            };
            document.bindings.root.inputs.children = {
                type: "slot",
                list: true,
                static: ["placement"]
            };
        });
        await flush();

        state.update(document => {
            document.bindings[HEADER].inputs.title.static = "Changed";
        });
        await flush();

        state.undo();
        expect(state.read().elements.placement).toBeUndefined();
        expect(state.read().elements[HEADER]).toBeDefined();
        expect(state.read().bindings[HEADER].inputs.title.static).toBe("Changed");

        state.redo();
        expect(state.read().elements.placement).toBeDefined();
        expect(state.read().bindings.root.inputs.children.static).toEqual(["placement"]);
    });
});
