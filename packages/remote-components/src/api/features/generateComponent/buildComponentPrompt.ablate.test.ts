import { describe, expect, it } from "vitest";
import { buildComponentPrompt } from "./buildComponentPrompt.js";

describe("buildComponentPrompt ablation", () => {
    it("keeps both statements of the prohibition word for word by default", () => {
        expect(buildComponentPrompt()).toContain(
            "17. For repeatable lists, use `list: true` inside params — NEVER use `multiple: true`\n"
        );
        expect(buildComponentPrompt()).toContain(
            "If `true`, the input becomes a repeatable list of objects. **Use `list: true`, NOT `multiple: true`.** |"
        );
    });

    it("leaves out only the prohibition when rule 17 is ablated", () => {
        const full = buildComponentPrompt();
        const ablated = buildComponentPrompt({ ablate: ["system.rule-17-multiple"] });
        expect(ablated).toContain("17. For repeatable lists, use `list: true` inside params\n");
        expect(ablated).not.toContain("multiple: true");
        expect(
            full
                .replace(" — NEVER use `multiple: true`", "")
                .replace(" **Use `list: true`, NOT `multiple: true`.**", "")
        ).toBe(ablated);
    });
});
