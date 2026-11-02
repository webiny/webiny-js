import { createAbstraction } from "@webiny/feature/api";
import type { CmsModelField } from "~/types/index.js";

/**
 * A filterable field stored under `entry.system`, registered by the feature that writes it.
 * Storage operations build the `system.*` filter fields from all registrations, so listing can
 * filter by them (`where: { system: { <fieldId>: ... } }`). Nested fields go in
 * `field.settings.fields`. Extend `ICmsEntrySystem` and `CmsEntryListWhereSystem` to type them.
 */
export interface ICmsEntrySystemField {
    readonly field: CmsModelField;
}

export const CmsEntrySystemField = createAbstraction<ICmsEntrySystemField>("Cms/Entry/SystemField");

export namespace CmsEntrySystemField {
    export type Interface = ICmsEntrySystemField;
}
