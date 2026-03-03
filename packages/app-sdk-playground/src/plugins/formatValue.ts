export function formatValue(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return String(value);
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    if (typeof value === "function") return `[Function]`;
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}
