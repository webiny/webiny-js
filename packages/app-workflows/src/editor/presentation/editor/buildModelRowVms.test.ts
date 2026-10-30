import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";
import { buildModelRowVms } from "./buildModelRowVms.js";
import type { ModelRowsParams } from "./buildModelRowVms.js";

const ARTICLE = createWorkflowModelRow({
    model: "cms.article",
    modelId: "article",
    name: "Article",
    workflow: { id: "workflow-1", name: "Article review", stepCount: 2 }
});
const PRESS = createWorkflowModelRow({
    model: "cms.press",
    modelId: "press",
    name: "Press",
    workflow: { id: "workflow-2", name: "Press approval", stepCount: 1 }
});
const BLOG = createWorkflowModelRow({
    model: "cms.blog",
    modelId: "blog",
    name: "Blog",
    workflow: null
});

const params = (overrides: Partial<ModelRowsParams> = {}): ModelRowsParams => {
    return {
        rows: [ARTICLE, PRESS, BLOG],
        activeModelId: null,
        draftOpen: false,
        draftIsNew: false,
        draftDirty: false,
        draftStepCount: 0,
        ...overrides
    };
};

describe("buildModelRowVms (R280)", () => {
    it("shows the step count for a row with a workflow and No workflow for the others", () => {
        const rows = buildModelRowVms(params());

        expect(rows.map(row => row.subLine)).toEqual(["2 steps", "1 step", "No workflow"]);
        expect(rows.map(row => row.bound)).toEqual([true, true, false]);
        expect(rows.map(row => row.modelId)).toEqual(["article", "press", "blog"]);
        expect(rows.map(row => row.name)).toEqual(["Article", "Press", "Blog"]);
    });

    it("shows the step count for the open model's loaded workflow, singular for one", () => {
        const many = buildModelRowVms(
            params({ activeModelId: "article", draftOpen: true, draftStepCount: 3 })
        );
        const one = buildModelRowVms(
            params({ activeModelId: "article", draftOpen: true, draftStepCount: 1 })
        );

        expect(many[0].subLine).toBe("3 steps");
        expect(one[0].subLine).toBe("1 step");
        expect(many[1].subLine).toBe("1 step");
    });

    it("keeps the bound name for the open model while its draft is new and unsaved", () => {
        const rows = buildModelRowVms(
            params({
                activeModelId: "blog",
                draftOpen: true,
                draftIsNew: true,
                draftDirty: true,
                draftStepCount: 2
            })
        );

        expect(rows[2].subLine).toBe("No workflow");
        expect(rows[2].bound).toBe(false);
    });

    it("marks the open row active and shows the unsaved dot only on it, only while dirty", () => {
        const clean = buildModelRowVms(params({ activeModelId: "press", draftOpen: true }));
        const dirty = buildModelRowVms(
            params({ activeModelId: "press", draftOpen: true, draftDirty: true })
        );

        expect(clean.map(row => row.active)).toEqual([false, true, false]);
        expect(clean.map(row => row.unsaved)).toEqual([false, false, false]);
        expect(dirty.map(row => row.unsaved)).toEqual([false, true, false]);
    });
});
