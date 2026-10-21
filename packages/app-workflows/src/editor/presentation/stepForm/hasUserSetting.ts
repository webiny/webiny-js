import type { JsonSchema } from "@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js";
import { getUserSettingKeys } from "~/editor/model/getUserSettingKeys.js";

/*
 * True when a top-level setting of the schema carries the `user` ui hint: the drawer then asks for
 * the first user results, so the setting's picker has options (R285). The key list is
 * `getUserSettingKeys` (Task 14), which also tells which saved ids to resolve.
 */
export const hasUserSetting = (schema: JsonSchema | null): boolean => {
    return getUserSettingKeys(schema).length > 0;
};
