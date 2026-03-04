export type Operator =
    | "=="
    | "!="
    | ">"
    | "<"
    | ">="
    | "<="
    | "contains"
    | "startsWith"
    | "endsWith"
    | "isEmpty"
    | "isNotEmpty";

export interface ParsedExpression {
    target: string;
    operator: Operator;
    value: string | number | boolean | null;
}

/**
 * Resolve a fieldPath that may contain `$` placeholders using the bindParentName.
 *
 * The bindParentName gives us the concrete indices for the current list context.
 * For example, if fieldPath is `panorama.hotspots.$.title` and bindParentName
 * is `panorama.hotspots.2`, the result is `panorama.hotspots.2.title`.
 *
 * Supports multiple nested `$` segments for deeply nested list objects.
 */
export function resolveFieldPath(fieldPath: string, bindParentName?: string): string {
    if (!fieldPath.includes("$")) {
        return fieldPath;
    }

    if (!bindParentName) {
        // No parent context, replace $ with 0 as fallback
        return fieldPath.replace(/\$/g, "0");
    }

    const pathParts = fieldPath.split(".");
    const parentParts = bindParentName.split(".");

    // Build a map of prefix -> index from the parent path.
    // E.g., parentName "panorama.hotspots.2.items.1" gives us:
    //   "panorama.hotspots" -> "2"
    //   "panorama.hotspots.2.items" -> "1"
    const indexMap = new Map<string, string>();
    const prefixParts: string[] = [];
    for (const part of parentParts) {
        if (/^\d+$/.test(part)) {
            indexMap.set(prefixParts.join("."), part);
        } else {
            prefixParts.push(part);
        }
    }

    // Walk through pathParts and replace each `$` with the corresponding index
    const resolved: string[] = [];
    const currentPrefix: string[] = [];
    for (const part of pathParts) {
        if (part === "$") {
            const key = currentPrefix.join(".");
            const index = indexMap.get(key) ?? "0";
            resolved.push(index);
        } else {
            currentPrefix.push(part);
            resolved.push(part);
        }
    }

    return resolved.join(".");
}

function compareValues(
    operator: string,
    val: unknown,
    rhs: string | number | boolean | null
): boolean {
    switch (operator) {
        case "==":
            return val == rhs;
        case "!=":
            return val != rhs;
        case ">":
            return Number(val) > Number(rhs);
        case "<":
            return Number(val) < Number(rhs);
        case ">=":
            return Number(val) >= Number(rhs);
        case "<=":
            return Number(val) <= Number(rhs);
        case "contains":
            return String(val ?? "").includes(String(rhs ?? ""));
        case "startsWith":
            return String(val ?? "").startsWith(String(rhs ?? ""));
        case "endsWith":
            return String(val ?? "").endsWith(String(rhs ?? ""));
        case "isEmpty":
            return val == null || val === "" || (Array.isArray(val) && val.length === 0);
        case "isNotEmpty":
            return val != null && val !== "" && !(Array.isArray(val) && val.length === 0);
        default:
            return false;
    }
}

/**
 * Evaluate a parsed expression against form values.
 *
 * If the resolved fieldPath ends with `.length`, it reads the array at the parent
 * path and uses its length as the left-hand value.
 */
export function evaluateExpression(
    parsed: ParsedExpression,
    getFormValue: (path: string) => unknown
): boolean {
    const { target, operator, value: rhs } = parsed;

    let val: unknown;
    if (target.endsWith(".length")) {
        const arrayPath = target.slice(0, -".length".length);
        const arr = getFormValue(arrayPath);
        val = Array.isArray(arr) ? arr.length : 0;
    } else {
        val = getFormValue(target);
    }

    return compareValues(operator, val, rhs);
}
