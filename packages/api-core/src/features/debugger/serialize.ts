import type { IDebuggerLimits } from "./limits.js";

export interface ISerializeResult {
    json: string;
    bytes: number;
    /** True if the value was replaced by the per-entry cap marker. */
    truncated: boolean;
}

/**
 * Markers stand in for values that cannot be represented as JSON.
 *
 * They are prefixed with `#` so a reader can tell at a glance that a value was substituted by the
 * serializer rather than being what the code actually held - the previous `[undefined]` read as an
 * array literal in documents that are full of real arrays.
 */
const UNDEFINED = "#[Undefined value]";
const CIRCULAR = "#[Circular]";
const DEPTH_LIMIT = "#[Depth limit]";

const isPlainValue = (value: unknown): boolean => {
    const type = typeof value;
    return type === "string" || type === "number" || type === "boolean" || value === null;
};

const describeBinary = (value: ArrayBufferView): string => {
    const name = value.constructor?.name || "TypedArray";
    return `#[${name} ${value.byteLength} bytes]`;
};

/**
 * Walks a value into a JSON-safe structure, applying depth, string and array caps as it goes.
 *
 * Caps are applied during the walk rather than by slicing the finished JSON string, so the output is
 * always parseable.
 *
 * A custom `toJSON` is never invoked - own properties are enumerated instead. That means an object
 * is reported as its internals rather than its intended representation, which is what you want when
 * debugging, and it removes a whole class of failure where a third-party `toJSON` throws.
 */
const walk = (
    value: unknown,
    limits: IDebuggerLimits,
    seen: WeakSet<object>,
    depth: number
): unknown => {
    if (value === undefined) {
        /**
         * Only reached for array elements and for a top-level payload. Object properties holding
         * `undefined` are dropped before they get here, matching `JSON.stringify`.
         *
         * Inside an array the element cannot be dropped without shifting every later index, and
         * `JSON.stringify` would turn it into `null` - which is a meaningful value in its own right.
         */
        return UNDEFINED;
    }

    if (isPlainValue(value)) {
        if (typeof value === "string" && value.length > limits.stringLength) {
            const kept = value.slice(0, limits.stringLength);
            return `${kept}…(${value.length - limits.stringLength} more)`;
        }
        /**
         * Infinity and NaN serialize to `null`, which silently loses the distinction. Keep them
         * readable instead.
         */
        if (typeof value === "number" && !Number.isFinite(value)) {
            return String(value);
        }
        return value;
    }

    if (typeof value === "bigint") {
        return `${value.toString()}n`;
    }

    if (typeof value === "symbol") {
        return String(value);
    }

    if (typeof value === "function") {
        return `#[Function: ${value.name || "anonymous"}]`;
    }

    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
            stack: value.stack
        };
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (value instanceof RegExp) {
        return value.toString();
    }

    if (ArrayBuffer.isView(value)) {
        return describeBinary(value);
    }

    if (value instanceof ArrayBuffer) {
        return `#[ArrayBuffer ${value.byteLength} bytes]`;
    }

    if (depth >= limits.depth) {
        return DEPTH_LIMIT;
    }

    if (typeof value !== "object" || value === null) {
        return String(value);
    }

    if (seen.has(value)) {
        return CIRCULAR;
    }
    seen.add(value);

    try {
        if (Array.isArray(value)) {
            const kept = value.slice(0, limits.arrayLength).map(item => {
                return walk(item, limits, seen, depth + 1);
            });
            if (value.length > limits.arrayLength) {
                kept.push(`…(${value.length - limits.arrayLength} more items)`);
            }
            return kept;
        }

        if (value instanceof Map) {
            const entries: unknown[] = [];
            for (const [key, item] of value.entries()) {
                if (entries.length >= limits.arrayLength) {
                    entries.push(`…(${value.size - limits.arrayLength} more entries)`);
                    break;
                }
                entries.push([
                    walk(key, limits, seen, depth + 1),
                    walk(item, limits, seen, depth + 1)
                ]);
            }
            return { __type: "Map", entries };
        }

        if (value instanceof Set) {
            const items: unknown[] = [];
            for (const item of value.values()) {
                if (items.length >= limits.arrayLength) {
                    items.push(`…(${value.size - limits.arrayLength} more items)`);
                    break;
                }
                items.push(walk(item, limits, seen, depth + 1));
            }
            return { __type: "Set", items };
        }

        const result: Record<string, unknown> = {};
        for (const key of Object.keys(value)) {
            /**
             * A getter can throw. One bad property must not take down the whole entry, let alone the
             * request that is being observed.
             */
            let item: unknown;
            try {
                item = (value as Record<string, unknown>)[key];
            } catch (ex) {
                result[key] = `#[Throws: ${ex instanceof Error ? ex.message : String(ex)}]`;
                continue;
            }

            /**
             * Drop the key, as `JSON.stringify` does.
             *
             * Captured payloads are frequently copies of something that went over the wire, and the
             * wire never carried these keys - keeping them would describe a request that was never
             * made.
             */
            if (item === undefined) {
                continue;
            }

            result[key] = walk(item, limits, seen, depth + 1);
        }
        return result;
    } finally {
        /**
         * Only guard against cycles along the current branch. Without this, a value referenced twice
         * as siblings would report the second one as circular.
         */
        seen.delete(value);
    }
};

/**
 * Serializes a captured payload to JSON, never throwing and always producing valid JSON.
 */
export const serialize = (value: unknown, limits: IDebuggerLimits): ISerializeResult => {
    let json: string;

    try {
        const walked = walk(value, limits, new WeakSet(), 0);
        json = JSON.stringify(walked) ?? JSON.stringify(UNDEFINED);
    } catch (ex) {
        const message = ex instanceof Error ? ex.message : String(ex);
        json = JSON.stringify({ __serializationFailed: true, message });
    }

    let bytes = Buffer.byteLength(json, "utf8");
    let truncated = false;

    if (bytes > limits.entryBytes) {
        /**
         * Slicing the string would produce invalid JSON, so the payload is replaced wholesale.
         */
        json = JSON.stringify({ truncated: true, originalBytes: bytes });
        bytes = Buffer.byteLength(json, "utf8");
        truncated = true;
    }

    return { json, bytes, truncated };
};
