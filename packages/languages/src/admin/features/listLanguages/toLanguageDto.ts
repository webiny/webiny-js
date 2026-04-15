import type { LanguageDto } from "./abstractions.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms/types.js";

export function toLanguageDto(entry: CmsContentEntry): LanguageDto {
    return {
        id: entry.entryId,
        code: entry.values.code,
        name: entry.values.name,
        direction: entry.values.direction,
        isDefault: entry.values.isDefault,
        enabled: entry.values.enabled
    };
}
