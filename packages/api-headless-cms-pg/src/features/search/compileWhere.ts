import type { CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import { createExpressions } from "@webiny/api-headless-cms-storage";
import type { Expression } from "@webiny/api-headless-cms-storage";
import type {
    FieldFilterCreateRegistry,
    FieldFilterValueTransformRegistry
} from "@webiny/api-headless-cms-storage";
import type { ValueFilterRegistry } from "@webiny/db-utils";
import type { ScopeRegistry } from "~/features/scopes/abstractions.js";
import { compileFilter } from "./compileFilter.js";
import { SqlFragment } from "./SqlFragment.js";

export interface ICompileWhereParams {
    scope: ScopeRegistry.Scope;
    where: Partial<CmsEntryListWhere>;
    filterCreateRegistry: FieldFilterCreateRegistry.Interface;
    transformRegistry: FieldFilterValueTransformRegistry.Interface;
    valueFilterRegistry: ValueFilterRegistry.Interface;
}

/* Mirrors the evaluation order of the in-memory filter: own filters are always ANDed. */
const compileExpression = (scope: ScopeRegistry.Scope, expression: Expression): SqlFragment => {
    const filters = expression.filters.map(filter => compileFilter(scope, filter));
    const children = expression.expressions.map(child => compileExpression(scope, child));

    const parts = [...filters];
    if (expression.condition === "OR") {
        parts.push(
            children.length > 0
                ? SqlFragment.join(children, " OR ")
                      .wrap("(", ")")
                      .markScoped(children.every(child => child.scoped))
                      .estimateAs({ kind: "or", parts: children })
                : new SqlFragment("FALSE")
        );
    } else {
        parts.push(...children);
    }
    if (parts.length === 0) {
        return new SqlFragment("TRUE");
    }
    // Scoped when every part is: then the GIN indexes alone find the rows.
    if (parts.length === 1) {
        const [part] = parts;
        return new SqlFragment(`(${part.sql})`, part.bindings, part.scoped, part.estimate);
    }
    return SqlFragment.join(parts, " AND ")
        .wrap("(", ")")
        .markScoped(parts.every(part => part.scoped))
        .estimateAs({ kind: "and", parts });
};

/**
 * Parses `where` with the shared CMS filter parser (same paths, operators and value transforms as
 * every other storage) and compiles the result into one SQL predicate.
 */
export const compileWhere = (params: ICompileWhereParams): SqlFragment => {
    if (Object.keys(params.where).length === 0) {
        return new SqlFragment("TRUE");
    }
    const expression = createExpressions({
        where: params.where,
        fields: params.scope.plan.fields,
        filterCreateRegistry: params.filterCreateRegistry,
        transformRegistry: params.transformRegistry,
        valueFilterRegistry: params.valueFilterRegistry
    });
    return compileExpression(params.scope, expression);
};
