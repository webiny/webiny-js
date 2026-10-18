import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapAiTool } from "./mapAiTool.js";
import { createAiToolDto } from "~/editor/testing/editorFixtures.js";

describe("mapAiTool", () => {
    it("maps every field of a tool", () => {
        const dto = createAiToolDto({
            name: "rewriteContent",
            title: "Rewrite content",
            description: "Rewrites a field.",
            changesContent: true
        });

        expect(mapAiTool(dto)).toEqual({
            name: "rewriteContent",
            title: "Rewrite content",
            description: "Rewrites a field.",
            changesContent: true
        });
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
