import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapEditorStepType } from "./mapEditorStepType.js";
import { createEditorStepTypeDto } from "~/editor/testing/editorFixtures.js";

describe("mapEditorStepType", () => {
    it("maps an available type with its config schema", () => {
        const configSchema = { type: "object", properties: { teams: { type: "array" } } };
        const dto = createEditorStepTypeDto({
            type: "review",
            title: "Review",
            configSchema
        });

        expect(mapEditorStepType(dto)).toEqual({
            type: "review",
            title: "Review",
            available: true,
            unavailableReason: null,
            configSchema
        });
    });

    it("keeps the reason of an unavailable type", () => {
        const dto = createEditorStepTypeDto({
            type: "ai",
            title: "AI",
            available: false,
            unavailableReason: "Requires the AI Power-Ups licence."
        });

        const stepType = mapEditorStepType(dto);

        expect(stepType.available).toBe(false);
        expect(stepType.unavailableReason).toBe("Requires the AI Power-Ups licence.");
        expect(stepType.configSchema).toBeNull();
    });

    it("maps an absent reason and an absent schema to null", () => {
        const dto = createEditorStepTypeDto();
        Reflect.deleteProperty(dto, "unavailableReason");
        Reflect.deleteProperty(dto, "configSchema");

        const stepType = mapEditorStepType(dto);

        expect(stepType.unavailableReason).toBeNull();
        expect(stepType.configSchema).toBeNull();
    });

    it("maps a schema that is not an object to null", () => {
        const dto = createEditorStepTypeDto({ configSchema: "not a schema" });

        expect(mapEditorStepType(dto).configSchema).toBeNull();
    });
});
