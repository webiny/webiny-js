/**
 * How many slot columns a single model's own fields may use, across all families (system fields are
 * always slotted and do not count). Fields beyond the budget are still filterable: their values go
 * to the `ov` overflow column, equality stays GIN-indexed through `tok`, other operators and sorting
 * run without an index. Override with `WEBINY_PG_FIELD_BUDGET`.
 */
export const DEFAULT_FIELD_BUDGET = 50;

export const getFieldBudget = (): number => {
    const raw = Number(process.env.WEBINY_PG_FIELD_BUDGET);
    return Number.isFinite(raw) && raw >= 0 && process.env.WEBINY_PG_FIELD_BUDGET !== undefined
        ? raw
        : DEFAULT_FIELD_BUDGET;
};
