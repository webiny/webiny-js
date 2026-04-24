import type { ConsoleMessage } from "./types.js";

export function formatValue(value: any): string {
    if (value === null) {
        return "null";
    }
    if (value === undefined) {
        return "undefined";
    }
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number") {
        return String(value);
    }
    if (typeof value === "boolean") {
        return String(value);
    }
    if (value instanceof Error) {
        return `${value.name}: ${value.message}`;
    }
    if (typeof value === "function") {
        return `[Function]`;
    }
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

export function createCustomConsole(
    messages: ConsoleMessage[],
    onUpdate: (messages: ConsoleMessage[]) => void
) {
    return {
        log: (...args: any[]) => {
            const message = args.map(arg => formatValue(arg)).join(" ");
            messages.push({ type: "log", message, timestamp: new Date().toISOString() });
            onUpdate([...messages]);
        },
        error: (...args: any[]) => {
            const message = args.map(arg => formatValue(arg)).join(" ");
            messages.push({ type: "error", message, timestamp: new Date().toISOString() });
            onUpdate([...messages]);
        },
        warn: (...args: any[]) => {
            const message = args.map(arg => formatValue(arg)).join(" ");
            messages.push({ type: "warn", message, timestamp: new Date().toISOString() });
            onUpdate([...messages]);
        },
        info: (...args: any[]) => {
            const message = args.map(arg => formatValue(arg)).join(" ");
            messages.push({ type: "info", message, timestamp: new Date().toISOString() });
            onUpdate([...messages]);
        }
    };
}
