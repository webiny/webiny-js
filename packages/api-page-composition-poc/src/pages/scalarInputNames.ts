import type { ComponentInput, ComponentManifest } from "@webiny/website-builder-sdk";

/** Input kinds a single derived string can stand in for. */
const SCALAR_TYPES = new Set(["text", "longText", "lexical", "number", "boolean", "color", "date"]);

/**
 * The manifest inputs a derived scalar may be bound to.
 *
 * A list input handed anything other than an array throws inside `ComponentInputTraverser`, and an
 * object input would be written as a string where its fields are expected, so both are excluded and
 * keep whatever the manifest's `defaults.inputs` provides.
 *
 * Filtering against the MANIFEST rather than against Plan's contract also absorbs the drift between
 * them: the generated component's inputs are the model's rendering of the contract, so a prop that
 * was renamed, dropped or restructured on the way simply finds no home here instead of being bound
 * to an input that does not exist.
 */
export const scalarInputNames = (manifest: ComponentManifest): Set<string> => {
    const names = new Set<string>();

    for (const input of manifest.inputs ?? []) {
        const definition = input as ComponentInput & {
            name?: string;
            type?: string;
            list?: boolean;
            fields?: unknown[];
        };

        if (!definition.name || definition.list) {
            continue;
        }
        if (Array.isArray(definition.fields) && definition.fields.length > 0) {
            continue;
        }
        if (definition.type && !SCALAR_TYPES.has(definition.type)) {
            continue;
        }

        names.add(definition.name);
    }

    return names;
};
