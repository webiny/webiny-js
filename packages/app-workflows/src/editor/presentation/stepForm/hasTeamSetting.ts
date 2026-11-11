import type { JsonSchema } from "@webiny/app-admin";
import { getTeamSettingKeys } from "~/editor/model/getTeamSettingKeys.js";

/*
 * True when a top-level setting of the schema carries the `team` ui hint: the drawer then asks
 * for the first team results, so the setting's picker has options (R284). The key list is Task 9's
 * `getTeamSettingKeys`, which also feeds the editor's team-name lookup.
 */
export const hasTeamSetting = (schema: JsonSchema | null): boolean => {
    return getTeamSettingKeys(schema).length > 0;
};
