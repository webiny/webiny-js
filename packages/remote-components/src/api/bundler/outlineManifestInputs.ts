import type { InputOutline } from "./types.js";

interface ManifestInput {
    name?: unknown;
    fields?: unknown;
}

/** The inputs of a built manifest, as names only, in the same shape the source derivation gives. */
export function outlineManifestInputs(inputs: unknown): InputOutline[] {
    if (!Array.isArray(inputs)) {
        return [];
    }

    const outlines: InputOutline[] = [];

    for (const input of inputs as ManifestInput[]) {
        if (!input || typeof input.name !== "string") {
            continue;
        }
        outlines.push({ name: input.name, fields: outlineManifestInputs(input.fields) });
    }

    return outlines;
}
