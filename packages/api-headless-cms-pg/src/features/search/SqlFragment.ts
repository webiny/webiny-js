import type { Knex } from "knex";

/*
 * How to estimate the rows a predicate matches within its model (see estimateMatches):
 * - planner: the planner's estimate of `fragment` (default: the predicate itself);
 * - range: a range on a slot column; the column's statistics mix every model's values, so the
 *   model's own index entries are counted (up to a limit);
 * - and / or: combined from the parts' estimates;
 * - share: a fixed share of the model's rows (a scan predicate the planner can't estimate).
 */
export type IMatchEstimate =
    | { kind: "planner"; fragment: SqlFragment }
    | { kind: "range" }
    | { kind: "and" | "or"; parts: SqlFragment[] }
    | { kind: "share"; share: number }
    /* The planner's estimate, but never more than `rows` (an `in` on a field unique per view). */
    | { kind: "atMost"; rows: number };

/**
 * A piece of SQL with its `?` bindings (knex raw style). Array values go in as array literals
 * (`textArray`), because knex expands array bindings into value lists.
 */
export class SqlFragment {
    public constructor(
        public readonly sql: string,
        public readonly bindings: unknown[] = [],
        /*
         * True when the predicate is answered by a GIN index whose keys carry the scope id (`tok`
         * tokens, `tsv` lexemes): it needs no scope condition to find its rows. Lost by join and
         * wrap (a negation is not scoped); combined explicitly where it still holds.
         */
        public readonly scoped: boolean = false,
        /* How to estimate its matches; null: the planner's estimate of the predicate. Lost like `scoped`. */
        public readonly estimate: IMatchEstimate | null = null
    ) {}

    public markScoped(scoped = true): SqlFragment {
        return new SqlFragment(this.sql, this.bindings, scoped, this.estimate);
    }

    public estimateAs(estimate: IMatchEstimate): SqlFragment {
        return new SqlFragment(this.sql, this.bindings, this.scoped, estimate);
    }

    public static join(parts: SqlFragment[], separator: string): SqlFragment {
        return new SqlFragment(
            parts.map(part => part.sql).join(separator),
            parts.flatMap(part => part.bindings)
        );
    }

    /*
     * A text[] parameter (array literal), not a subquery: the planner then sees the values and
     * estimates `tok @> ...` from the column statistics instead of a fixed guess.
     */
    public static textArray(values: string[]): SqlFragment {
        const literal = values
            .map(value => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
            .join(",");
        return new SqlFragment("?::text[]", [`{${literal}}`]);
    }

    /* Bindings for knex.raw(); values are produced by the compiler, so their types are known-safe. */
    public rawBindings(...extra: unknown[]): Knex.RawBinding[] {
        return [...this.bindings, ...extra] as Knex.RawBinding[];
    }

    public wrap(prefix: string, suffix: string): SqlFragment {
        return new SqlFragment(`${prefix}${this.sql}${suffix}`, this.bindings);
    }
}
