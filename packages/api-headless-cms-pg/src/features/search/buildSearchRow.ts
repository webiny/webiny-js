import type { ScopeRegistry } from "~/features/scopes/abstractions.js";
import type { SlotFamily } from "~/features/schema/slots.js";
import { getValue } from "@webiny/api-headless-cms-storage";
import { extractValues } from "./extractValues.js";
import { createNullToken, createToken, overflowTokenKey, tokenValue } from "./tokens.js";
import { jsonLeaves, jsonToken } from "./jsonLeaves.js";
import type { IFullTextValue } from "./lexemes.js";
import { phrasesOf, textModeOf } from "./lexemes.js";

/* Families of slots a list can sort by (compileSort); their NULL rows carry a null token. */
const SORTABLE_FAMILIES = new Set<SlotFamily>(["t", "n", "b"]);

export interface ISearchRow {
    columns: Record<string, unknown>;
    /* Full-text key -> concatenated text and its text mode, turned into lexemes by buildTsvector(). */
    fullText: Record<string, IFullTextValue>;
}

/* Converts an extracted value to the slot family's type, or null when it does not fit. */
export const coerce = (family: SlotFamily, value: unknown): unknown => {
    if (family === "n" || family === "na") {
        const number = typeof value === "number" ? value : Number(value);
        return Number.isFinite(number) ? number : null;
    }
    if (family === "b") {
        if (typeof value === "boolean") {
            return value;
        }
        if (value === "true" || value === "false") {
            return value === "true";
        }
        return null;
    }
    if (typeof value === "boolean") {
        return value ? "true" : "false";
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    return String(value);
};

export const buildSearchRow = (
    scope: ScopeRegistry.Scope,
    view: number,
    entry: Record<string, any>
): ISearchRow => {
    const columns: Record<string, unknown> = {
        scope_id: scope.scopeId,
        view,
        entry_id: entry.entryId,
        id: entry.id
    };
    const tokens = new Set<string>();
    const fullText: Record<string, IFullTextValue> = {};
    const json: Record<string, unknown> = {};
    const overflow: Record<string, unknown[]> = {};

    for (const indexPath of Object.values(scope.plan.paths)) {
        if (indexPath.family === "j") {
            const key = scope.slotMap.json[indexPath.path];
            const value = getValue(entry, indexPath.path);
            if (!key || value === undefined || value === null) {
                continue;
            }
            json[key] = value;
            const words: string[] = [];
            for (const [subPath, leaf] of jsonLeaves(value)) {
                tokens.add(jsonToken(scope.scopeId, key, subPath, tokenValue(leaf)));
                if (typeof leaf === "string") {
                    words.push(leaf);
                }
            }
            const ftKey = scope.slotMap.ft[indexPath.path];
            if (ftKey && words.length > 0) {
                fullText[ftKey] = { text: words.join(" "), mode: "words" };
            }
            continue;
        }
        const slot = scope.slotMap.slots[indexPath.path];
        const ftKey = scope.slotMap.ft[indexPath.path];
        const isOverflow = !slot && scope.slotMap.overflow[indexPath.path] === true;
        if (!slot && !ftKey && !isOverflow) {
            continue;
        }
        const family = indexPath.family;
        const values = extractValues(entry, indexPath)
            .map(value => coerce(family, value))
            .filter(value => value !== null);
        if (values.length === 0) {
            if (slot && SORTABLE_FAMILIES.has(family)) {
                tokens.add(createNullToken(scope.scopeId, slot));
            }
            continue;
        }
        if (ftKey) {
            fullText[ftKey] = {
                text: values.join(" "),
                mode: textModeOf(indexPath),
                phrases: phrasesOf(indexPath)
            };
        }
        if (isOverflow) {
            overflow[indexPath.key] = values;
            for (const value of values) {
                tokens.add(createToken(scope.scopeId, overflowTokenKey(indexPath.key), value));
            }
            continue;
        }
        if (!slot) {
            continue;
        }
        const isArray = family === "ta" || family === "na";
        // A single-value field can still yield several values when a path crosses an unexpected list.
        columns[slot] = isArray ? values : values[0];
        for (const value of values) {
            tokens.add(createToken(scope.scopeId, slot, value));
        }
    }

    columns.tok = [...tokens];
    if (Object.keys(json).length > 0) {
        columns.sj = JSON.stringify(json);
    }
    if (Object.keys(overflow).length > 0) {
        columns.ov = JSON.stringify(overflow);
    }
    return { columns, fullText };
};
