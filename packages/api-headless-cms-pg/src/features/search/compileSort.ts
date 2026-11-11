import WebinyError from "@webiny/error";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { FieldSortingRegistry } from "@webiny/api-headless-cms-storage";
import { extractSort } from "@webiny/api-headless-cms-storage/filtering/fields/extractSort.js";
import type { ScopeRegistry } from "~/features/scopes/abstractions.js";
import { notSearchable } from "./compileFilter.js";

export interface ISortSpec {
    column: string;
    descending: boolean;
    /* SQL cast for cursor values of this column. */
    cast: string;
    /* The slot column when the sort has one (and so a partial index); null for overflow values. */
    slot: string | null;
}

/**
 * Resolves the single sort key (the CMS allows exactly one) to its slot column. Postgres' default
 * NULL placement (last for ASC, first for DESC) matches the in-memory sort-then-reverse behaviour.
 */
export const compileSort = (
    model: CmsModel,
    scope: ScopeRegistry.Scope,
    sort: string[] | undefined,
    sortingRegistry: FieldSortingRegistry.Interface
): ISortSpec => {
    const keys = sort && sort.length > 0 ? sort : ["savedOn_DESC"];
    if (keys.length > 1) {
        throw new WebinyError(
            "Sorting is limited to a single field.",
            "SORT_MULTIPLE_FIELDS_ERROR",
            {
                sort: keys
            }
        );
    }
    const { valuePath, reverse } = extractSort({
        model,
        sortBy: keys[0],
        fields: scope.plan.fields,
        sortingRegistry
    });
    const indexPath = scope.plan.paths[valuePath];
    const slot = scope.slotMap.slots[valuePath];
    if (indexPath && !slot && scope.slotMap.overflow[valuePath]) {
        if (indexPath.family !== "t" && indexPath.family !== "n" && indexPath.family !== "b") {
            throw notSearchable(valuePath, "list values cannot be sorted");
        }
        // Over the field budget: sorts by the stored value without an index (fine for small models).
        const literal = indexPath.key.replace(/'/g, "''");
        const castBy = { t: ' COLLATE "C"', n: "::numeric", b: "::boolean" }[indexPath.family];
        const cursorCast = { t: "", n: "::numeric", b: "::boolean" }[indexPath.family];
        return {
            column: `((ov -> '${literal}' ->> 0)${castBy})`,
            descending: reverse,
            cast: cursorCast,
            slot: null
        };
    }
    if (!indexPath || !slot) {
        throw notSearchable(valuePath, scope.slotMap.unindexed[valuePath] || "not sortable");
    }
    if (indexPath.family === "ta" || indexPath.family === "na") {
        throw notSearchable(valuePath, "list values cannot be sorted");
    }
    let cast = "";
    if (indexPath.family === "n") {
        cast = "::numeric";
    } else if (indexPath.family === "b") {
        cast = "::boolean";
    }
    return { column: slot, descending: reverse, cast, slot };
};
