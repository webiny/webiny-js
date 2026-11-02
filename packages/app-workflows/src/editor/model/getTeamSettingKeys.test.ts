import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { JsonSchema } from "@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js";
import { getTeamSettingKeys } from "./getTeamSettingKeys.js";

describe("getTeamSettingKeys (R271, R284)", () => {
    it("lists the top-level settings that carry the team ui hint", () => {
        const schema: JsonSchema = {
            type: "object",
            properties: {
                owner: { type: "string", ui: "team" },
                url: { type: "string" },
                backup: { type: "string", ui: "team" }
            }
        };

        expect(getTeamSettingKeys(schema)).toEqual(["owner", "backup"]);
    });

    it("is empty for no schema, no properties and other hints", () => {
        expect(getTeamSettingKeys(null)).toEqual([]);
        expect(getTeamSettingKeys({ type: "object" })).toEqual([]);
        expect(
            getTeamSettingKeys({
                type: "object",
                properties: { who: { type: "string", ui: "user" } }
            })
        ).toEqual([]);
    });
});
