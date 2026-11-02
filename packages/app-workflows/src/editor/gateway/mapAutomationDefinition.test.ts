import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapAutomationDefinition } from "./mapAutomationDefinition.js";
import { createAutomationDefinitionDto } from "~/editor/testing/editorFixtures.js";

describe("mapAutomationDefinition", () => {
    it("maps the id, the name, the scope and the settings schema", () => {
        const settingsSchema = {
            type: "object",
            description: "Checks every link.",
            properties: { timeout: { type: "number" } }
        };
        const dto = createAutomationDefinitionDto({
            id: "automation-7",
            name: "Check links",
            models: ["cms.*", "wb.page"],
            settingsSchema
        });

        expect(mapAutomationDefinition(dto)).toEqual({
            id: "automation-7",
            name: "Check links",
            models: ["cms.*", "wb.page"],
            settingsSchema
        });
    });

    it("maps a null settings schema to null (an automation without settings)", () => {
        const dto = createAutomationDefinitionDto({ settingsSchema: null });

        expect(mapAutomationDefinition(dto).settingsSchema).toBeNull();
    });

    it("maps a settings schema that is not an object to null", () => {
        const dto = createAutomationDefinitionDto({ settingsSchema: ["x"] });

        expect(mapAutomationDefinition(dto).settingsSchema).toBeNull();
    });
});
