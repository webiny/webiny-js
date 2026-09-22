import type { ComponentInput, ComponentManifest } from "@webiny/website-builder-sdk";
import {
    isCredibleDestination,
    isPlaceholderDestination,
    type DestinationContext
} from "~/pages/isCredibleDestination.js";

interface InputDefinition {
    name: string;
    type?: string;
    list?: boolean;
    fields?: InputDefinition[];
}

const asDefinition = (input: ComponentInput): InputDefinition =>
    input as unknown as InputDefinition;

const isUrlField = (definition: InputDefinition): boolean =>
    definition.type === "url" || /(^|[^a-z])(url|href|link|to)([^a-z]|$)/i.test(definition.name);

const isComposite = (definition: InputDefinition): boolean =>
    Array.isArray(definition.fields) && definition.fields.length > 0;

/** A destination the model invented, removed from the page. */
export interface InventedDestination {
    /** Where it sat, as a slash path through the inputs — `privacyPolicyLink/url`. */
    path: string;
    /** What it said, kept so a later pass can try to recover the page it was reaching for. */
    value: string;
}

export interface StripResult {
    inputs: Record<string, unknown>;
    invented: InventedDestination[];
}

/**
 * Remove destinations the model invented from a component's inputs, wherever they sit.
 *
 * The rule itself is not new — what is new is that it is asked on every shape rather than only on a
 * list of composites. The five-site collection produced 36 dead links in headers, footers and forms,
 * all of them model-invented relative paths sitting on scalars and single composites, where the
 * check simply never ran.
 *
 * An invented destination is emptied rather than replaced. Substituting a guess would put a link
 * somewhere the page never pointed; an empty destination is honest about knowing nothing, and the
 * value is returned so a caller that knows which pages were migrated can try to recover it.
 */
export const stripInventedDestinations = (params: {
    inputs: Record<string, unknown>;
    manifest: ComponentManifest;
    context: DestinationContext;
}): StripResult => {
    const { inputs, manifest, context } = params;
    const invented: InventedDestination[] = [];

    const walk = (value: unknown, definition: InputDefinition, path: string): unknown => {
        if (definition.list && Array.isArray(value)) {
            return value.map((item, index) =>
                walk(item, { ...definition, list: false }, `${path}/${index}`)
            );
        }

        if (isComposite(definition)) {
            if (typeof value !== "object" || value === null || Array.isArray(value)) {
                return value;
            }
            const record = value as Record<string, unknown>;
            const next: Record<string, unknown> = { ...record };
            for (const field of definition.fields ?? []) {
                if (field.name in next) {
                    next[field.name] = walk(next[field.name], field, `${path}/${field.name}`);
                }
            }
            return next;
        }

        if (!isUrlField(definition) || typeof value !== "string") {
            return value;
        }
        if (isCredibleDestination(value, context)) {
            return value;
        }

        /*
         * Emptied either way, but only an invented path is recorded: `#` and `` go nowhere openly
         * and mislead nobody, so counting them would inflate the number this fix is measured by.
         */
        if (value.trim() && !isPlaceholderDestination(value)) {
            invented.push({ path, value: value.trim() });
        }
        return "";
    };

    const next: Record<string, unknown> = { ...inputs };
    for (const input of manifest.inputs ?? []) {
        const definition = asDefinition(input);
        if (definition.name in next) {
            next[definition.name] = walk(next[definition.name], definition, definition.name);
        }
    }

    return { inputs: next, invented };
};
