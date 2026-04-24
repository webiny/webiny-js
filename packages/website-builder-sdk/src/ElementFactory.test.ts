import { describe, it, expect } from "vitest";
import { ElementFactory } from "./ElementFactory.js";
import { DocumentOperations } from "./documentOperations/index.js";
import type { ComponentManifest, Document } from "~/types.js";

const components: Record<string, ComponentManifest> = {
    "Webiny/Root": {
        name: "Webiny/Root",
        label: "Main Content",
        tags: [],
        inputs: [
            {
                type: "slot",
                list: true,
                renderer: "Webiny/Slot",
                defaultValue: [],
                name: "children"
            }
        ]
    },
    "FunnelBuilder/Funnel": {
        name: "FunnelBuilder/Funnel",
        label: "Funnel",
        tags: [],
        inputs: [
            {
                type: "object",
                renderer: "Webiny/Object",
                name: "fields",
                list: true,
                fields: [],
                defaultValue: []
            },
            {
                type: "number",
                renderer: "Webiny/Number",
                name: "activeStep",
                label: "Active Step",
                defaultValue: 0
            },
            {
                type: "slot",
                list: true,
                renderer: "Webiny/Slot",
                defaultValue: [],
                name: "steps"
            },
            {
                type: "object",
                renderer: "FunnelBuilder/ConditionRulesRenderer",
                name: "conditionRules",
                list: true,
                fields: []
            }
        ]
    },
    "FunnelBuilder/Step": {
        name: "FunnelBuilder/Step",
        label: "Funnel Step",
        tags: [],
        inputs: [
            {
                type: "text",
                renderer: "Webiny/Input",
                name: "label",
                label: "Label"
            },
            {
                type: "slot",
                list: true,
                renderer: "Webiny/Slot",
                defaultValue: [],
                name: "children"
            }
        ]
    }
};

/**
 * Extract private fields from operation instances for assertion.
 */
function serializeOp(op: any) {
    if (op instanceof DocumentOperations.AddElement) {
        return { type: "AddElement", element: op["element"] };
    }
    if (op instanceof DocumentOperations.AddToParent) {
        return { type: "AddToParent", element: op["element"], index: op["index"] };
    }
    if (op instanceof DocumentOperations.SetGlobalInputBinding) {
        return {
            type: "SetGlobalInputBinding",
            elementId: op["elementId"],
            bindingPath: op["bindingPath"],
            binding: op["binding"]
        };
    }
    if (op instanceof DocumentOperations.SetGlobalStyleBinding) {
        return {
            type: "SetGlobalStyleBinding",
            elementId: op["elementId"],
            bindingPath: op["bindingPath"],
            binding: op["binding"]
        };
    }
    return op;
}

describe("ElementFactory", () => {
    it("should produce correct operation sequence for a Funnel with two Steps", () => {
        const factory = new ElementFactory(components);
        const result = factory.createElementFromComponent({
            componentName: "FunnelBuilder/Funnel",
            parentId: "root",
            slot: "children",
            index: 0,
            bindings: {
                inputs: {
                    fields: [],
                    activeStep: 0,
                    steps: [
                        {
                            action: "CreateElement",
                            params: {
                                component: "FunnelBuilder/Step",
                                inputs: { label: "Step 1", children: [] }
                            }
                        },
                        {
                            action: "CreateElement",
                            params: {
                                component: "FunnelBuilder/Step",
                                inputs: { label: "Final Step", children: [] }
                            }
                        }
                    ]
                }
            }
        });

        const ops = result.operations.map(serializeOp);
        const funnelId = result.element.id;

        // 0: AddElement — Funnel
        expect(ops[0].type).toBe("AddElement");
        expect(ops[0].element.component.name).toBe("FunnelBuilder/Funnel");

        // 1: AddToParent — Funnel → root/children at index 0
        expect(ops[1].type).toBe("AddToParent");
        expect(ops[1].element.id).toBe(funnelId);
        expect(ops[1].index).toBe(0);

        // 2: SetGlobalInputBinding — activeStep = 0
        expect(ops[2].type).toBe("SetGlobalInputBinding");
        expect(ops[2].elementId).toBe(funnelId);
        expect(ops[2].bindingPath).toBe("activeStep");
        expect(ops[2].binding.static).toBe(0);

        // 3: AddElement — Step 1
        const step1Id = ops[3].element.id;
        expect(ops[3].type).toBe("AddElement");
        expect(ops[3].element.component.name).toBe("FunnelBuilder/Step");
        expect(ops[3].element.parent).toEqual({ id: funnelId, slot: "steps" });

        // 4: AddToParent — Step 1 (undefined = append)
        expect(ops[4].type).toBe("AddToParent");
        expect(ops[4].element.id).toBe(step1Id);
        expect(ops[4].index).toBeUndefined();

        // 5: Step 1 label binding
        expect(ops[5].bindingPath).toBe("label");
        expect(ops[5].binding.static).toBe("Step 1");

        // 6: Step 1 children binding
        expect(ops[6].bindingPath).toBe("children");
        expect(ops[6].binding.static).toEqual([]);

        // 7-8: Step 1 style bindings
        expect(ops[7].bindingPath).toBe("display");
        expect(ops[8].bindingPath).toBe("flexDirection");

        // 9: SetGlobalInputBinding — steps slot metadata (no static, AddToParent handles it)
        expect(ops[9].type).toBe("SetGlobalInputBinding");
        expect(ops[9].elementId).toBe(funnelId);
        expect(ops[9].bindingPath).toBe("steps");
        expect(ops[9].binding.static).toBeUndefined();
        expect(ops[9].binding.type).toBe("slot");
        expect(ops[9].binding.list).toBe(true);

        // 10: AddElement — Step 2
        expect(ops[10].element.component.name).toBe("FunnelBuilder/Step");

        // 11: AddToParent — Step 2 (undefined = append)
        expect(ops[11].index).toBeUndefined();

        // 12-15: Step 2 bindings + styles
        expect(ops[12].binding.static).toBe("Final Step");
        expect(ops[13].binding.static).toEqual([]);

        // 16: SetGlobalInputBinding — steps slot metadata (no static)
        expect(ops[16].type).toBe("SetGlobalInputBinding");
        expect(ops[16].elementId).toBe(funnelId);
        expect(ops[16].bindingPath).toBe("steps");
        expect(ops[16].binding.static).toBeUndefined();

        // 17-18: Funnel style bindings
        expect(ops[17].bindingPath).toBe("display");
        expect(ops[18].bindingPath).toBe("flexDirection");

        expect(ops).toHaveLength(19);
    });

    it("should produce correct document after applying all operations", () => {
        const factory = new ElementFactory(components);
        const result = factory.createElementFromComponent({
            componentName: "FunnelBuilder/Funnel",
            parentId: "root",
            slot: "children",
            index: 0,
            bindings: {
                inputs: {
                    fields: [],
                    activeStep: 0,
                    steps: [
                        {
                            action: "CreateElement",
                            params: {
                                component: "FunnelBuilder/Step",
                                inputs: { label: "Step 1", children: [] }
                            }
                        },
                        {
                            action: "CreateElement",
                            params: {
                                component: "FunnelBuilder/Step",
                                inputs: { label: "Final Step", children: [] }
                            }
                        }
                    ]
                }
            }
        });

        const document = {
            state: {},
            elements: {
                root: {
                    type: "Webiny/Element",
                    id: "root",
                    component: { name: "Webiny/Root" }
                }
            },
            bindings: {}
        } as unknown as Document;

        for (const op of result.operations) {
            op.apply(document);
        }

        const funnelId = result.element.id;

        // Both step elements exist in the document.
        const stepElements = Object.values(document.elements).filter(
            el => el.component.name === "FunnelBuilder/Step"
        );
        expect(stepElements).toHaveLength(2);

        // Both steps have their correct labels.
        const labels = stepElements.map(el => document.bindings[el.id]?.inputs?.label?.static);
        expect(labels).toContain("Step 1");
        expect(labels).toContain("Final Step");

        // The steps binding contains both step IDs in order.
        const stepsBinding = document.bindings[funnelId]?.inputs?.steps;
        expect(stepsBinding?.list).toBe(true);
        expect(stepsBinding?.type).toBe("slot");
        expect(stepsBinding?.static).toHaveLength(2);

        const step1 = stepElements.find(
            el => document.bindings[el.id]?.inputs?.label?.static === "Step 1"
        )!;
        const step2 = stepElements.find(
            el => document.bindings[el.id]?.inputs?.label?.static === "Final Step"
        )!;
        expect(stepsBinding?.static).toEqual([step1.id, step2.id]);
    });
});
