import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapAiTool } from "./mapAiTool.js";
import { createAiToolDto } from "~/editor/testing/editorFixtures.js";

describe("mapAiTool", () => {
    it("maps every field of a tool", () => {
        const dto = createAiToolDto({
            name: "rewriteContent",
            label: "Rewrite content",
            summary: "Rewrites a field.",
            changesContent: true
        });

        expect(mapAiTool(dto)).toEqual({
            name: "rewriteContent",
            label: "Rewrite content",
            summary: "Rewrites a field.",
            changesContent: true
        });
    });

    it("drops the model-facing description and title a response may still carry", () => {
        const dto = {
            ...createAiToolDto({ label: "Read fields", summary: "Reads every field." }),
            title: "Read target",
            description: "Reads the content under review: its title and every field"
        };

        const tool = mapAiTool(dto);

        expect(tool.summary).toBe("Reads every field.");
        expect(tool).not.toHaveProperty("description");
        expect(tool).not.toHaveProperty("title");
    });

    it("keeps a read-only tool as not changing content", () => {
        expect(mapAiTool(createAiToolDto({ changesContent: false })).changesContent).toBe(false);
    });

    it("maps an absent changesContent to false", () => {
        const dto = createAiToolDto();
        Reflect.deleteProperty(dto, "changesContent");

        expect(mapAiTool(dto).changesContent).toBe(false);
    });
});
