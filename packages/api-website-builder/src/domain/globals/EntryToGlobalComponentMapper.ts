import type { CmsEntry } from "@webiny/api-headless-cms/types";
import type { CmsEntryWbGlobalComponent, GlobalComponent } from "./abstractions.js";
import { GlobalComponentLanguage } from "./GlobalComponentLanguage.js";

export class EntryToGlobalComponentMapper {
    static toGlobalComponent(entry: CmsEntry<CmsEntryWbGlobalComponent>): GlobalComponent {
        return {
            name: entry.values.name,
            language: GlobalComponentLanguage.from(entry.values.language).toString(),
            ...(entry.values.scope ? { scope: entry.values.scope } : {}),
            elements: entry.values.elements ?? {},
            bindings: entry.values.bindings ?? {}
        };
    }
}
