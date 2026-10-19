/** Parses JSON, or returns `undefined` for anything that does not parse. */
export function parseJson(source: string): unknown {
    try {
        return JSON.parse(source);
    } catch {
        return undefined;
    }
}
