import WebinyError from "@webiny/error";
import type { Filter } from "@webiny/api-headless-cms-storage/filtering/expressions/createExpressions.js";
import type { ScopeRegistry } from "~/features/scopes/abstractions.js";
import type { SlotFamily } from "~/features/schema/slots.js";
import { coerce } from "./buildSearchRow.js";
import { createToken, overflowTokenKey, tokenValue } from "./tokens.js";
import type { IIndexPath } from "~/features/indexPlan/createIndexPlan.js";
import { jsonToken } from "./jsonLeaves.js";
import { SqlFragment } from "./SqlFragment.js";
import { compileTextPrefilter, textModeOf } from "./lexemes.js";
import { readsIx } from "~/features/indexMode/indexMode.js";

const escapeLike = (value: string): string => value.replace(/[\\%_]/g, m => `\\${m}`);

/* Same word splitting as the in-memory `contains` filter. */
const containsWords = (value: string): string[] => {
    return value
        .replace(/\s+/g, " ")
        .trim()
        .replace(/:/g, "")
        .split(" ")
        .filter(word => word.length > 0);
};

const elementFamily = (family: SlotFamily): SlotFamily => {
    if (family === "ta") {
        return "t";
    }
    if (family === "na") {
        return "n";
    }
    return family;
};

const cast = (family: SlotFamily): string => {
    const scalar = elementFamily(family);
    if (scalar === "n") {
        return "::numeric";
    }
    if (scalar === "b") {
        return "::boolean";
    }
    return "";
};

const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : [value]);

/* System fields with one row per entry (or revision) in each view (single text values). */
const UNIQUE_PER_VIEW = ["entryId", "id"];

/* From this many values on, an "in" on a lean scope tests the row's tokens with a hashed lookup. */
const LONG_LIST = 64;
/* From this many values on, an indexed scope does too: the planner no longer uses the GIN. */
const VERY_LONG_LIST = 1000;

/*
 * Any of the tokens. `tok && array` compares every token of a row with every value (a nested loop):
 * 10,000 values are ~300,000 comparisons per row, seconds on a few thousand rows. Rows that `tok &&`
 * finds through the GIN are not tested again, but a lean scope has no GIN and reads its rows one by
 * one, and on an indexed scope the planner estimates a very long overlap to match most of the scope
 * and reads its rows instead. There, the values are tested with `= ANY`, which Postgres hashes.
 */
const anyToken = (scope: ScopeRegistry.Scope, tokens: SqlFragment, count: number): SqlFragment =>
    count >= (readsIx(scope.indexMode) ? VERY_LONG_LIST : LONG_LIST)
        ? tokens.wrap("EXISTS (SELECT 1 FROM unnest(tok) t WHERE t = ANY(", "))")
        : tokens.wrap("tok && ", "").markScoped();

export const notSearchable = (path: string, reason: string): WebinyError => {
    return new WebinyError(
        `Field path "${path}" is not searchable in pg storage (${reason}).`,
        "PG_NOT_SEARCHABLE",
        { path, reason }
    );
};

const findJsonField = (
    scope: ScopeRegistry.Scope,
    path: string
): { key: string; subPath: string } | null => {
    for (const [fieldPath, key] of Object.entries(scope.slotMap.json)) {
        if (path.startsWith(`${fieldPath}.`)) {
            return { key, subPath: path.slice(fieldPath.length + 1) };
        }
    }
    return null;
};

/**
 * Searchable-json sub-paths are dynamic, so they have no slot: equality uses the `tok` path=value
 * tokens (GIN), everything else evaluates a jsonb path expression on the model's rows (no index).
 */
const compileJsonFilter = (
    scope: ScopeRegistry.Scope,
    filter: Filter,
    key: string,
    subPath: string
): SqlFragment => {
    const operation = filter.filter.operation;
    const compareValue = filter.compareValue;
    const tokens = (values: unknown[]) =>
        SqlFragment.textArray(
            values.map(value => jsonToken(scope.scopeId, key, subPath, tokenValue(value)))
        );
    // Text of the value at the sub-path; arrays render as JSON text, which suits substring checks.
    const text = new SqlFragment("(sj->?) #>> string_to_array(?, '.')", [key, subPath]);
    const json = new SqlFragment("(sj->?) #> string_to_array(?, '.')", [key, subPath]);

    switch (operation) {
        case "eq":
            if (compareValue === null || compareValue === undefined) {
                return json.wrap("", " IS NULL");
            }
            return tokens(asList(compareValue)).wrap("tok @> ", "").markScoped();
        case "in":
        case "and_in": {
            const values = asList(compareValue);
            if (values.length === 0) {
                return new SqlFragment("FALSE");
            }
            return operation === "in"
                ? anyToken(scope, tokens(values), values.length)
                : tokens(values).wrap("tok @> ", "").markScoped();
        }
        case "contains": {
            const words = containsWords(String(compareValue ?? ""));
            if (words.length === 0) {
                return new SqlFragment("TRUE");
            }
            return SqlFragment.join(
                words.map(
                    word =>
                        new SqlFragment(`${text.sql} ILIKE ?`, [
                            ...text.bindings,
                            `%${escapeLike(word)}%`
                        ])
                ),
                " AND "
            );
        }
        case "startsWith":
            return new SqlFragment(`${text.sql} ILIKE ?`, [
                ...text.bindings,
                `${escapeLike(String(compareValue))}%`
            ]);
        case "gt":
        case "gte":
        case "lt":
        case "lte":
        case "between": {
            const isNumber =
                typeof (Array.isArray(compareValue) ? compareValue[0] : compareValue) === "number";
            // Numbers compare numerically only when the stored leaf is a JSON number.
            const value = isNumber
                ? new SqlFragment(
                      `CASE WHEN jsonb_typeof(${json.sql}) = 'number' THEN (${text.sql})::numeric END`,
                      [...json.bindings, ...text.bindings]
                  )
                : text;
            if (operation === "between") {
                const [from, to] = Array.isArray(compareValue)
                    ? compareValue
                    : [compareValue, compareValue];
                return new SqlFragment(`${value.sql} BETWEEN ? AND ?`, [
                    ...value.bindings,
                    from,
                    to
                ]);
            }
            const operator = { gt: ">", gte: ">=", lt: "<", lte: "<=" }[operation];
            return new SqlFragment(`${value.sql} ${operator} ?`, [...value.bindings, compareValue]);
        }
        default:
            throw new WebinyError(
                `Operator "${operation}" is not supported by pg storage.`,
                "PG_UNSUPPORTED_OPERATOR",
                { operation, path: filter.path }
            );
    }
};

/**
 * A path over the model's field budget has no slot column. Its values are a JSON array in the `ov`
 * column: equality still goes through `tok` (GIN), other operators scan the model's rows.
 */
const compileOverflowFilter = (
    scope: ScopeRegistry.Scope,
    filter: Filter,
    indexPath: IIndexPath
): SqlFragment => {
    const operation = filter.filter.operation;
    const compareValue = filter.compareValue;
    const family = indexPath.family as SlotFamily;
    const isArray = family === "ta" || family === "na";
    const scalar = elementFamily(family);
    const key = overflowTokenKey(indexPath.key);
    const tokens = (values: unknown[]) =>
        SqlFragment.textArray(
            values.map(value => createToken(scope.scopeId, key, coerce(scalar, value)))
        );
    const element = scalar === "n" ? "v::numeric" : "v";
    const elementwise = (predicate: SqlFragment): SqlFragment =>
        new SqlFragment(
            `EXISTS (SELECT 1 FROM jsonb_array_elements_text(ov -> ?) v WHERE ${predicate.sql})`,
            [indexPath.key, ...predicate.bindings]
        );

    switch (operation) {
        case "eq":
            if (compareValue === null || compareValue === undefined) {
                return new SqlFragment("(ov -> ?) IS NULL", [indexPath.key]);
            }
            return tokens(asList(compareValue)).wrap("tok @> ", "").markScoped();
        case "in":
        case "and_in": {
            const values = asList(compareValue);
            if (values.length === 0) {
                return new SqlFragment("FALSE");
            }
            return operation === "and_in" && isArray
                ? tokens(values).wrap("tok @> ", "").markScoped()
                : anyToken(scope, tokens(values), values.length);
        }
        case "contains": {
            if (compareValue === null || compareValue === undefined) {
                return new SqlFragment("TRUE");
            }
            const words = containsWords(String(compareValue));
            if (words.length === 0) {
                return new SqlFragment("FALSE");
            }
            return elementwise(
                SqlFragment.join(
                    words.map(word => new SqlFragment("v ILIKE ?", [`%${escapeLike(word)}%`])),
                    " AND "
                )
            );
        }
        case "startsWith":
            return elementwise(
                new SqlFragment("v ILIKE ?", [`${escapeLike(String(compareValue))}%`])
            );
        case "gt":
        case "gte":
        case "lt":
        case "lte": {
            const operator = { gt: ">", gte: ">=", lt: "<", lte: "<=" }[operation];
            return elementwise(
                new SqlFragment(`${element} ${operator} ?${cast(family)}`, [
                    coerce(scalar, compareValue)
                ])
            );
        }
        case "between": {
            const [from, to] = Array.isArray(compareValue)
                ? compareValue
                : [compareValue, compareValue];
            return elementwise(
                new SqlFragment(`${element} BETWEEN ?${cast(family)} AND ?${cast(family)}`, [
                    coerce(scalar, from),
                    coerce(scalar, to)
                ])
            );
        }
        default:
            throw new WebinyError(
                `Operator "${operation}" is not supported by pg storage.`,
                "PG_UNSUPPORTED_OPERATOR",
                { operation, path: filter.path }
            );
    }
};

/**
 * On a text field with a full-text key, `contains` and `startsWith` also check the `tsv` index (see
 * compileTextPrefilter); the ILIKE predicate stays as the exact check.
 */
const withTextPrefilter = (
    scope: ScopeRegistry.Scope,
    filter: Filter,
    indexPath: IIndexPath,
    predicate: SqlFragment
): SqlFragment => {
    const operation = filter.filter.operation;
    const key = scope.slotMap.ft[filter.path];
    if (!key || (operation !== "contains" && operation !== "startsWith")) {
        return predicate;
    }
    const query = compileTextPrefilter(
        scope.scopeId,
        key,
        operation,
        String(filter.compareValue ?? ""),
        // While the rows are rebuilt for new settings, only what old and new rows both have.
        textModeOf(scope.readPlan.paths[filter.path] ?? indexPath)
    );
    if (!query) {
        return predicate;
    }
    // On a "words" field the index condition is part of what `contains` means (word starts), so it
    // stays under a negation too. Estimated by the tsv part alone: no statistics for the ILIKE.
    return new SqlFragment(
        `(tsv @@ ?::tsquery AND ${predicate.sql})`,
        [query, ...predicate.bindings],
        true
    ).estimateAs({
        kind: "planner",
        fragment: new SqlFragment("tsv @@ ?::tsquery", [query], true)
    });
};

/**
 * Compiles one parsed filter (path + operator + compare value) into a predicate on the search row.
 * Equality-type operators go through the `tok` GIN index; ranges, prefixes and substrings use the
 * slot columns.
 */
export const compileFilter = (scope: ScopeRegistry.Scope, filter: Filter): SqlFragment => {
    const operation = filter.filter.operation;
    const compareValue = filter.compareValue;

    if (!filter.filter.canUse({ value: undefined, compareValue })) {
        return new SqlFragment("TRUE");
    }

    const jsonField = findJsonField(scope, filter.path);
    if (jsonField) {
        const result = compileJsonFilter(scope, filter, jsonField.key, jsonField.subPath);
        return filter.negate ? result.wrap("(", ") IS NOT TRUE") : result;
    }

    const indexPath = scope.plan.paths[filter.path];
    const slot = scope.slotMap.slots[filter.path];
    if (indexPath && !slot && scope.slotMap.overflow[filter.path]) {
        const result = compileOverflowFilter(scope, filter, indexPath);
        return filter.negate ? result.wrap("(", ") IS NOT TRUE") : result;
    }
    if (!indexPath || !slot || indexPath.family === "j") {
        const reason = scope.slotMap.unindexed[filter.path] || "unknown path";
        throw notSearchable(filter.path, reason);
    }
    const family = indexPath.family as SlotFamily;
    const isArray = family === "ta" || family === "na";
    const scalar = elementFamily(family);
    const token = (value: unknown) => createToken(scope.scopeId, slot, coerce(scalar, value));
    const tokens = (values: unknown[]) => SqlFragment.textArray(values.map(token));

    // Element-wise predicate: on list slots "any element matches".
    const elementwise = (predicate: (column: string) => SqlFragment): SqlFragment => {
        if (!isArray) {
            return predicate(slot);
        }
        const inner = predicate("v");
        return new SqlFragment(
            `EXISTS (SELECT 1 FROM unnest(${slot}) v WHERE ${inner.sql})`,
            inner.bindings
        );
    };

    let result: SqlFragment;
    switch (operation) {
        case "eq": {
            if (compareValue === null || compareValue === undefined) {
                result = new SqlFragment(
                    isArray ? `(${slot} IS NULL OR cardinality(${slot}) = 0)` : `${slot} IS NULL`
                );
                break;
            }
            result = tokens(asList(compareValue)).wrap("tok @> ", "").markScoped();
            break;
        }
        case "in":
        case "and_in": {
            const values = asList(compareValue);
            if (values.length === 0) {
                result = new SqlFragment("FALSE");
                break;
            }
            // and_in on a single-value field behaves like "in" (any of), as in the in-memory filter.
            if (operation === "and_in" && isArray) {
                result = tokens(values).wrap("tok @> ", "").markScoped();
            } else if (UNIQUE_PER_VIEW.includes(filter.path) && values.length >= LONG_LIST) {
                /*
                 * Ids: the slot holds each whole, and its btree index serves `= ANY` (hashed when
                 * tested row by row). The column's statistics mix every model's values, but an id
                 * has one row per view, so the list's length bounds the matches. Other fields keep
                 * their tokens, whose statistics are the model's own: misestimated, a slot `= ANY`
                 * read 150,000 rows to find 4,000 instead of combining two GIN lookups.
                 */
                result = SqlFragment.textArray(values.map(value => String(coerce(scalar, value))))
                    .wrap(`${slot} = ANY(`, ")")
                    .estimateAs({ kind: "atMost", rows: values.length });
            } else {
                result = anyToken(scope, tokens(values), values.length);
            }
            break;
        }
        case "contains": {
            if (compareValue === null || compareValue === undefined) {
                result = new SqlFragment("TRUE");
                break;
            }
            const words = containsWords(String(compareValue));
            if (words.length === 0) {
                result = new SqlFragment("FALSE");
                break;
            }
            result = elementwise(column =>
                SqlFragment.join(
                    words.map(
                        word =>
                            new SqlFragment(`${column}::text ILIKE ?`, [`%${escapeLike(word)}%`])
                    ),
                    " AND "
                )
            );
            result = withTextPrefilter(scope, filter, indexPath, result);
            break;
        }
        case "startsWith": {
            const prefix = `${escapeLike(String(compareValue))}%`;
            result = elementwise(column => new SqlFragment(`${column}::text ILIKE ?`, [prefix]));
            result = withTextPrefilter(scope, filter, indexPath, result);
            break;
        }
        case "gt":
        case "gte":
        case "lt":
        case "lte": {
            const operator = { gt: ">", gte: ">=", lt: "<", lte: "<=" }[operation];
            const value = coerce(scalar, compareValue);
            result = elementwise(
                column => new SqlFragment(`${column} ${operator} ?${cast(family)}`, [value])
            ).estimateAs({ kind: "range" });
            break;
        }
        case "between": {
            const [from, to] = Array.isArray(compareValue)
                ? compareValue
                : [compareValue, compareValue];
            const bounds = [coerce(scalar, from), coerce(scalar, to)];
            result = elementwise(
                column =>
                    new SqlFragment(
                        `${column} BETWEEN ?${cast(family)} AND ?${cast(family)}`,
                        bounds
                    )
            ).estimateAs({ kind: "range" });
            break;
        }
        default:
            throw new WebinyError(
                `Operator "${operation}" is not supported by pg storage.`,
                "PG_UNSUPPORTED_OPERATOR",
                { operation, path: filter.path }
            );
    }

    if (!filter.negate) {
        return result;
    }
    // NULL-safe negation: a missing value matches "not X", as in the in-memory filter.
    return result.wrap("(", ") IS NOT TRUE");
};
