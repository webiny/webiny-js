import { FieldBuilderRegistry } from "../abstractions.js";
import { buildCanonicalAssetFieldSettings, isAssetField } from "./AssetFieldType.js";

/**
 * Structural, mutable field shape shared by `CmsModelField` (update path) and
 * `CmsModelFieldInput` (create path) — enough for asset detection + stamping.
 */
interface NormalizableField {
    type?: string | null;
    renderer?: { name?: string | null } | null;
    settings?: { fields?: NormalizableField[]; [key: string]: unknown } | null;
}

/**
 * Stamp the canonical Asset sub-field schema onto every Asset field in a model,
 * in place, on save. This is the single point that guarantees Asset fields have the
 * correct typed nested shape regardless of origin:
 *  - the Admin palette and default-fields only need to emit a *minimal* asset field
 *    (`type: "object"` + the asset renderer + optional settings),
 *  - and code-created fields (`fields.asset()`) already match, so re-stamping is a
 *    no-op for them.
 *
 * Because the canonical schema comes from the same `AssetFieldBuilder` that backs
 * `fields.asset()`, admin-created and code-created asset fields stay identical.
 */
export const normalizeAssetFields = (
    fields: NormalizableField[] | undefined | null,
    registry: FieldBuilderRegistry.Interface
): void => {
    if (!Array.isArray(fields) || fields.length === 0) {
        return;
    }

    // Built lazily so models without any asset field pay nothing.
    let canonical: ReturnType<typeof buildCanonicalAssetFieldSettings> | undefined;

    const walk = (list: NormalizableField[]): void => {
        for (const field of list) {
            if (isAssetField(field)) {
                if (!canonical) {
                    canonical = buildCanonicalAssetFieldSettings(registry);
                }
                field.settings = {
                    ...field.settings,
                    fields: canonical?.fields ?? [],
                    layout: canonical?.layout ?? []
                };
                // The asset field's own sub-fields are canonical — don't recurse.
                continue;
            }

            // Non-asset object fields may nest asset fields (e.g. inside a group).
            const childFields = field.settings?.fields;
            if (Array.isArray(childFields)) {
                walk(childFields);
            }
        }
    };

    walk(fields);
};
