import { describe, expect, it } from "vitest";
import { z } from "zod";
import { aiStepConfigSchema } from "~/api/features/WorkflowReview/aiStepConfigSchema.js";

describe("aiStepConfigSchema (R164, R166)", () => {
    it("defaults tools to an empty list", () => {
        const parsed = aiStepConfigSchema.safeParse({
            instructions: "Check the tone.",
            model: "anthropic/claude-a"
        });

        expect(parsed.success).toBe(true);
        expect(parsed.data).toEqual({
            instructions: "Check the tone.",
            model: "anthropic/claude-a",
            tools: []
        });
    });

    it("keeps the tools it is given and drops unknown keys", () => {
        const parsed = aiStepConfigSchema.safeParse({
            instructions: "Check the tone.",
            model: "anthropic/claude-a",
            tools: ["readTarget"],
            extra: true
        });

        expect(parsed.data).toEqual({
            instructions: "Check the tone.",
            model: "anthropic/claude-a",
            tools: ["readTarget"]
        });
    });

    it.each([
        ["no config", undefined],
        ["a string", "text"],
        ["no instructions", { model: "m" }],
        ["no model", { instructions: "i" }],
        ["instructions that are not a string", { instructions: 1, model: "m" }],
        ["tools that are not a list", { instructions: "i", model: "m", tools: "readTarget" }],
        ["a tool that is not a string", { instructions: "i", model: "m", tools: [1] }]
    ])("refuses %s", (_label, config) => {
        expect(aiStepConfigSchema.safeParse(config).success).toBe(false);
    });

    it("describes itself as the editor's input: two required keys and a textarea (R166)", () => {
        const json = z.toJSONSchema(aiStepConfigSchema, {
            io: "input",
            unrepresentable: "any"
        }) as unknown as {
            properties: Record<string, Record<string, unknown>>;
            required: string[];
        };

        expect(json.required).toEqual(["instructions", "model"]);
        expect(json.properties.instructions).toEqual({ type: "string", ui: "textarea" });
        expect(json.properties.model).toEqual({ type: "string" });
        expect(json.properties.tools).toMatchObject({ type: "array", items: { type: "string" } });
    });
});
