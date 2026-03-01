type Operator =
    | "=="
    | "!="
    | ">"
    | "<"
    | ">="
    | "<="
    | "contains"
    | "startsWith"
    | "endsWith"
    | "isEmpty";

export interface ParsedExpression {
    fieldPath: string;
    operator: Operator;
    value: string | number | boolean | null;
}

const OPERATORS: Operator[] = [
    ">=",
    "<=",
    "!=",
    "==",
    ">",
    "<",
    "contains",
    "startsWith",
    "endsWith",
    "isEmpty"
];

function parseLiteral(raw: string): string | number | boolean | null {
    const trimmed = raw.trim();

    if (trimmed === "null") {
        return null;
    }
    if (trimmed === "true") {
        return true;
    }
    if (trimmed === "false") {
        return false;
    }

    // Quoted string
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1);
    }

    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== "") {
        return num;
    }

    // Return as-is string
    return trimmed;
}

export function parseExpression(expression: string): ParsedExpression | null {
    const trimmed = expression.trim();
    if (!trimmed) {
        return null;
    }

    // Strip the "entry." prefix from the left-hand side.
    const expr = trimmed.startsWith("entry.") ? trimmed.slice(6) : trimmed;

    for (const op of OPERATORS) {
        const idx = expr.indexOf(` ${op}` + (op === "isEmpty" ? "" : " "));
        if (idx === -1) {
            // Special case: isEmpty at the end with no right-hand side
            if (op === "isEmpty" && expr.endsWith(` ${op}`)) {
                const fieldPath = expr.slice(0, expr.length - op.length - 1).trim();
                if (fieldPath) {
                    return { fieldPath, operator: op, value: null };
                }
            }
            continue;
        }

        const fieldPath = expr.slice(0, idx).trim();
        if (!fieldPath) {
            continue;
        }

        if (op === "isEmpty") {
            return { fieldPath, operator: op, value: null };
        }

        const valueStr = expr.slice(idx + op.length + 2);
        return { fieldPath, operator: op, value: parseLiteral(valueStr) };
    }

    return null;
}

export function evaluateExpression(
    parsed: ParsedExpression,
    getFormValue: (path: string) => unknown
): boolean {
    const val = getFormValue(parsed.fieldPath);
    const rhs = parsed.value;

    switch (parsed.operator) {
        case "==":
            // eslint-disable-next-line eqeqeq
            return val == rhs;
        case "!=":
            // eslint-disable-next-line eqeqeq
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
        default:
            return false;
    }
}
