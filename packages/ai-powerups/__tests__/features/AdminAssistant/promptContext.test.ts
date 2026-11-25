import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { parsePromptContext } from "~/api/features/AdminAssistant/promptContext.js";

describe("parsePromptContext", () => {
    it("reads the ids the page editor's control sends", () => {
        const params = parsePromptContext({
            promptContext: {
                projectId: "velo",
                readerPersonaId: "riders",
                writerPersonaId: "friendly",
                additionalFileIds: ["f1", "f2"]
            }
        });

        expect(params).toEqual({
            projectId: "velo",
            readerPersonaId: "riders",
            writerPersonaId: "friendly",
            additionalFileIds: ["f1", "f2"]
        });
    });

    it("is nothing when no control chose anything", () => {
        expect(parsePromptContext(undefined)).toBeUndefined();
        expect(parsePromptContext({ promptContext: {} })).toBeUndefined();
        expect(parsePromptContext({ promptContext: "velo" })).toBeUndefined();
        expect(parsePromptContext({ other: { projectId: "velo" } })).toBeUndefined();
    });

    it("drops ids that are not strings and keeps at most ten files", () => {
        const files = Array.from({ length: 12 }, (_, index) => `f${index}`);
        const params = parsePromptContext({
            promptContext: { projectId: 7, additionalFileIds: [...files, 3] }
        });

        expect(params?.projectId).toBeNull();
        expect(params?.additionalFileIds).toEqual(files.slice(0, 10));
    });
});
