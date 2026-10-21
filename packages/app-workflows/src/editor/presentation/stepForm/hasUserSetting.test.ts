import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { JsonSchema } from "@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js";
import { hasUserSetting } from "./hasUserSetting.js";

describe("hasUserSetting (R285)", () => {
    it("is true when a top-level setting carries the user ui hint", () => {
        const schema: JsonSchema = {
            type: "object",
            properties: { owner: { type: "string", ui: "user" } }
        };

        expect(hasUserSetting(schema)).toBe(true);
    });

    it("is false for no schema and for settings without the hint", () => {
        const teamOnly: JsonSchema = {
            type: "object",
            properties: { owner: { type: "string", ui: "team" } }
        };

        expect(hasUserSetting(null)).toBe(false);
        expect(hasUserSetting(teamOnly)).toBe(false);
    });
});
