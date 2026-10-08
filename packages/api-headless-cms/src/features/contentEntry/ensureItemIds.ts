import { generateAlphaNumericLowerCaseId } from "@webiny/utils";
import type { CmsModelAst, CmsEntryValues } from "~/types/index.js";
import { ContentEntryTraverser } from "./ContentEntryTraverser/ContentEntryTraverser.js";

/**
 * Walk entry values using the model AST and assign a stable `_id` to every
 * object and dynamic-zone value — both list items and single values.
 *
 * - Values that already carry an `_id` keep it.
 * - Values without `_id` get a newly generated one.
 * - Duplicate `_id` values within a list array are silently regenerated.
 *
 * Uses `ContentEntryTraverser` so nested objects / dynamic zones are handled
 * automatically — no manual recursion needed.
 */
export async function ensureItemIds(modelAst: CmsModelAst, values: CmsEntryValues): Promise<void> {
    const traverser = new ContentEntryTraverser(modelAst);

    await traverser.traverse(values, async ({ field, value }) => {
        if (field.type !== "object" && field.type !== "dynamicZone") {
            return;
        }

        // List fields: assign _id to every array item.
        if (field.list && Array.isArray(value)) {
            const seen = new Set<string>();

            for (const item of value) {
                if (item == null || typeof item !== "object") {
                    continue;
                }

                if (!item._id || seen.has(item._id)) {
                    item._id = generateAlphaNumericLowerCaseId(12);
                }

                seen.add(item._id);
            }
            return;
        }

        // Single-value: assign _id to the value object.
        if (!field.list && value != null && typeof value === "object" && !Array.isArray(value)) {
            if (!value._id) {
                value._id = generateAlphaNumericLowerCaseId(12);
            }
        }
    });
}
