import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { getStepTypeOptions } from "./getStepTypeOptions.js";
import type { StepTypeOptionsParams } from "./getStepTypeOptions.js";

const params = (overrides: Partial<StepTypeOptionsParams> = {}): StepTypeOptionsParams => {
    return {
        stepTypes: createStepTypes(),
        automations: [createWebhookAutomation()],
        namespace: "cms.article",
        appKind: "cms",
        ...overrides
    };
};

describe("getStepTypeOptions", () => {
    it("lists every type in the order the server returned, with the UI names (D98)", () => {
        const options = getStepTypeOptions(params());

        expect(options.map(option => option.type)).toEqual(["review", "ai", "automation"]);
        expect(options.map(option => option.label)).toEqual(["People", "AI", "Automation"]);
    });

    it("carries the picker descriptions", () => {
        const options = getStepTypeOptions(params());

        expect(options.map(option => option.description)).toEqual([
            "Members of one or more teams review.",
            "An AI model reviews against your written instructions.",
            "Runs a code-defined automation, such as Send webhook."
        ]);
    });

    it("makes every type addable when everything is available", () => {
        const options = getStepTypeOptions(params());

        expect(options.map(option => option.addable)).toEqual([true, true, true]);
        expect(options.map(option => option.reason)).toEqual([null, null, null]);
    });

    it("disables AI without the licence, with the design reason", () => {
        const stepTypes = createStepTypes().map(item => {
            return item.type === "ai"
                ? { ...item, available: false, unavailableReason: "AI powerups are not enabled." }
                : item;
        });

        const ai = getStepTypeOptions(params({ stepTypes })).find(option => option.type === "ai");

        expect(ai).toMatchObject({
            addable: false,
            reason: "Requires the AI Power-Ups licence."
        });
    });

    it("disables AI when its row has no config schema (no AI editor, R275)", () => {
        const stepTypes = createStepTypes().map(item => {
            return item.type === "ai" ? { ...item, configSchema: null } : item;
        });

        const ai = getStepTypeOptions(params({ stepTypes })).find(option => option.type === "ai");

        expect(ai).toMatchObject({
            addable: false,
            reason: "Requires the AI Power-Ups licence."
        });
    });

    it("disables Automation when no definition covers the model, with the CMS reason", () => {
        const automations = [createWebhookAutomation({ models: ["wb.page"] })];

        const automation = getStepTypeOptions(params({ automations })).find(option => {
            return option.type === "automation";
        });

        expect(automation).toMatchObject({
            addable: false,
            reason: "No automations are available for this model."
        });
    });

    it("words the Automation reason for pages in the Website Builder", () => {
        const automations = [createWebhookAutomation({ models: ["cms.*"] })];

        const automation = getStepTypeOptions(
            params({ automations, namespace: "wb.page", appKind: "wb" })
        ).find(option => option.type === "automation");

        expect(automation).toMatchObject({
            addable: false,
            reason: "No automations are available for pages."
        });
    });

    it("keeps Automation addable when one of several definitions covers the model", () => {
        const automations = [
            createWebhookAutomation({ id: "a", models: ["wb.page"] }),
            createWebhookAutomation({ id: "b", models: ["cms.*"] })
        ];

        const automation = getStepTypeOptions(params({ automations })).find(option => {
            return option.type === "automation";
        });

        expect(automation?.addable).toBe(true);
    });

    it("disables Automation when the server says it is unavailable, with the design reason", () => {
        const stepTypes = createStepTypes().map(item => {
            return item.type === "automation"
                ? { ...item, available: false, unavailableReason: "No automation is defined." }
                : item;
        });

        const automation = getStepTypeOptions(params({ stepTypes })).find(option => {
            return option.type === "automation";
        });

        expect(automation).toMatchObject({
            addable: false,
            reason: "No automations are available for this model."
        });
    });

    it("lists a type the editor has no form for, never addable, with the server's title and reason", () => {
        const stepTypes = [
            ...createStepTypes(),
            {
                type: "custom",
                title: "Custom check",
                available: false,
                unavailableReason: "Not installed.",
                configSchema: null
            }
        ];

        const custom = getStepTypeOptions(params({ stepTypes })).find(option => {
            return option.type === "custom";
        });

        expect(custom).toEqual({
            type: "custom",
            label: "Custom check",
            description: null,
            addable: false,
            reason: "Not installed."
        });
    });

    it("never makes an available unknown type addable and gives no reason of its own", () => {
        const stepTypes = [
            {
                type: "custom",
                title: "Custom check",
                available: true,
                unavailableReason: null,
                configSchema: null
            }
        ];

        const [custom] = getStepTypeOptions(params({ stepTypes }));

        expect(custom.addable).toBe(false);
        expect(custom.reason).toBeNull();
    });
});
