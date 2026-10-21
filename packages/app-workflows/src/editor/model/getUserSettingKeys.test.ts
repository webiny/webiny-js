import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { JsonSchema } from "@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js";
import { getUserSettingKeys } from "./getUserSettingKeys.js";

describe("getUserSettingKeys (R271, R285)", () => {
    it("lists the top-level settings that carry the user ui hint", () => {
        const schema: JsonSchema = {
            type: "object",
            properties: {
                owner: { type: "string", ui: "user" },
                url: { type: "string" },
                backup: { type: "string", ui: "user" }
            }
        };

        expect(getUserSettingKeys(schema)).toEqual(["owner", "backup"]);
    });

    it("is empty for no schema, no properties and other hints", () => {
        expect(getUserSettingKeys(null)).toEqual([]);
        expect(getUserSettingKeys({ type: "object" })).toEqual([]);
        expect(
            getUserSettingKeys({
                type: "object",
                properties: { who: { type: "string", ui: "team" } }
            })
        ).toEqual([]);
    });
});
