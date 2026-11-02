import { describe, expect, it } from "vitest";
import { isWorkflowAiToolName } from "~/domain/aiTools/isWorkflowAiToolName.js";

describe("isWorkflowAiToolName (R167)", () => {
    it.each(["a", "readTarget", "updateTargetFields", "my_tool_2", "A", `a${"b".repeat(63)}`])(
        "accepts %s",
        name => {
            expect(isWorkflowAiToolName(name)).toBe(true);
        }
    );

    it.each([
        ["empty", ""],
        ["starts with a digit", "1tool"],
        ["starts with an underscore", "_tool"],
        ["contains a hyphen", "my-tool"],
        ["contains a space", "my tool"],
        ["contains a dot", "cms.tool"],
        ["contains a non-ASCII letter", "tÖol"],
        ["has a trailing newline", "tool\n"],
        ["is 65 characters long", `a${"b".repeat(64)}`]
    ])("rejects a name that %s", (_label, name) => {
        expect(isWorkflowAiToolName(name)).toBe(false);
    });
});
