import { getValue } from "@webiny/api-headless-cms-storage";
import type { IIndexPath } from "~/features/indexPlan/createIndexPlan.js";

const flatten = (value: unknown, out: unknown[]): void => {
    if (Array.isArray(value)) {
        for (const item of value) {
            flatten(item, out);
        }
        return;
    }
    if (value === null || value === undefined || value === "") {
        return;
    }
    out.push(value);
};

/**
 * Reads a path from a stored entry the way the in-memory filter does (through lists of objects),
 * applies the field's filter transform (datetime -> epoch ms) and returns the scalar values.
 */
export const extractValues = (entry: Record<string, unknown>, indexPath: IIndexPath): unknown[] => {
    const raw = getValue(entry, indexPath.path);
    const plain: unknown[] = [];
    flatten(raw, plain);
    const values: unknown[] = [];
    for (const value of plain) {
        if (typeof value === "object" && !(value instanceof Date)) {
            continue;
        }
        let transformed: unknown;
        try {
            transformed = indexPath.field.transform(value);
        } catch {
            continue;
        }
        if (transformed === null || transformed === undefined) {
            continue;
        }
        values.push(transformed);
    }
    return values;
};
