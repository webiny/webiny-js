import type { ThemeManifest } from "@webiny/theme-common";
import type {
    ClassifiedCluster,
    ComponentProp,
    PropObservation,
    TokenBinding
} from "~/domain/artifacts.js";
import { extractJson } from "~/features/shared/parseJson.js";

// Bounds so a runaway model response can't produce a pathological contract.
const MAX_PROP_DEPTH = 3;
const MAX_FIELDS = 12;
const MAX_VALUE_COUNTS = 6;

/**
 * The Plan model call — the prompt, system message and response parser shared by the Plan stage handler
 * and the single-component regenerate task (W8), so both propose contracts identically.
 */

export const PLAN_SYSTEM =
    "You propose a Webiny component contract for a website section. Respond ONLY with a JSON object, no prose.";

const slotLines = (manifest: ThemeManifest | null): string => {
    if (!manifest) {
        return "(no theme tokens available; propose props but leave tokenBindings empty)";
    }
    return manifest.slots
        .slice(0, 60)
        .map(slot => `- ${String(slot.path)}: ${slot.description || slot.displayName}`)
        .join("\n");
};

export const buildPlanPrompt = (
    cluster: ClassifiedCluster,
    manifest: ThemeManifest | null,
    instruction?: string
): string => {
    const digest = cluster.cluster.digest;
    const instances = cluster.cluster.members.length;
    const guidance = instruction?.trim()
        ? ["", "Operator guidance — follow this when proposing the contract:", instruction.trim()]
        : [];
    return [
        `Propose a component contract for this "${cluster.type}" section named "${cluster.name}".`,
        `Structure: ${digest.structure}`,
        `Counts: headings ${digest.headingCount}, images ${digest.imageCount}, links/buttons ${digest.linkCount}`,
        `This section appears on ${instances} instance(s) across the site.`,
        "Text observed across instances:",
        ...cluster.cluster.observedTexts.slice(0, 20).map(text => `- ${text}`),
        "",
        "Available theme tokens (bind visual props to these slot paths):",
        slotLines(manifest),
        ...guidance,
        "",
        "Model the contract as editable props. Rules:",
        `- "type" holds the BASE type only — a scalar (string, richText, url, number, boolean, image), a`,
        `  PascalCase composite name (Link, Image, Point, …), or an enum literal like "2 | 3 | 4". Do NOT`,
        `  put "?" or "[]" in the type; use the "optional" and "array" booleans instead.`,
        `- For a composite prop (an object, a Link/Image/Point, or an array of objects) list its sub-fields`,
        `  under "fields" (same shape, recursively, at most ${MAX_PROP_DEPTH} levels deep).`,
        `- "observation": estimate how the prop varies across the ${instances} instance(s). Set`,
        `  "presentInstances" (how many include it, ≤ ${instances}); for array props set "countMin"/"countMax"`,
        `  (items per instance); for enums/short scalars set "valueCounts" (frequent literals with counts,`,
        `  most frequent first). Omit fields you cannot estimate.`,
        "",
        "Respond with JSON:",
        '{ "props": [ { "name": "...", "type": "...", "optional": false, "array": false,',
        '    "fields": [ /* nested props, same shape, for composite types */ ],',
        '    "observedValues": ["..."],',
        '    "observation": { "presentInstances": 0, "countMin": null, "countMax": null,',
        '      "valueCounts": [ { "value": "...", "count": 0 } ] } } ],',
        '  "tokenBindings": [ { "target": "<prop or element>", "token": "<slot path>" } ] }'
    ].join("\n");
};

interface ContractJson {
    props?: unknown;
    tokenBindings?: unknown;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
    value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const asInt = (value: unknown): number | null =>
    typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null;

const parseObservation = (value: unknown): PropObservation | undefined => {
    const record = asRecord(value);
    if (!record) {
        return undefined;
    }
    const valueCounts = Array.isArray(record.valueCounts)
        ? (record.valueCounts as unknown[])
              .map(entry => {
                  const item = asRecord(entry);
                  return item && typeof item.value === "string"
                      ? { value: item.value, count: asInt(item.count) ?? 0 }
                      : null;
              })
              .filter((entry): entry is { value: string; count: number } => entry !== null)
              .slice(0, MAX_VALUE_COUNTS)
        : null;
    return {
        presentInstances: asInt(record.presentInstances),
        countMin: asInt(record.countMin),
        countMax: asInt(record.countMax),
        valueCounts: valueCounts && valueCounts.length > 0 ? valueCounts : null
    };
};

const parseProp = (item: unknown, depth: number): ComponentProp | null => {
    const prop = asRecord(item);
    if (!prop || typeof prop.name !== "string" || typeof prop.type !== "string") {
        return null;
    }
    const values = Array.isArray(prop.observedValues)
        ? (prop.observedValues as unknown[])
              .filter((value): value is string => typeof value === "string")
              .slice(0, 10)
        : [];
    const fields =
        depth + 1 < MAX_PROP_DEPTH && Array.isArray(prop.fields)
            ? (prop.fields as unknown[])
                  .map(field => parseProp(field, depth + 1))
                  .filter((field): field is ComponentProp => field !== null)
                  .slice(0, MAX_FIELDS)
            : [];
    return {
        name: prop.name,
        type: prop.type,
        optional: prop.optional === true,
        array: prop.array === true,
        fields: fields.length > 0 ? fields : undefined,
        observedValues: values,
        observation: parseObservation(prop.observation)
    };
};

/** Stamp the grounded instance count onto every prop (recursively), overriding any model-supplied total. */
const stampTotals = (props: ComponentProp[], total: number): void => {
    for (const prop of props) {
        prop.observation = { ...(prop.observation ?? {}), totalInstances: total };
        if (prop.fields) {
            stampTotals(prop.fields, total);
        }
    }
};

export const parsePlanContract = (
    text: string,
    instanceCount?: number
): { props: ComponentProp[]; tokenBindings: TokenBinding[] } | null => {
    const raw = extractJson<ContractJson>(text);
    if (!raw) {
        return null;
    }

    const props: ComponentProp[] = [];
    for (const item of Array.isArray(raw.props) ? (raw.props as unknown[]) : []) {
        const prop = parseProp(item, 0);
        if (prop) {
            props.push(prop);
        }
    }
    if (typeof instanceCount === "number") {
        stampTotals(props, instanceCount);
    }

    const tokenBindings: TokenBinding[] = [];
    for (const item of Array.isArray(raw.tokenBindings) ? (raw.tokenBindings as unknown[]) : []) {
        const binding = asRecord(item);
        if (binding && typeof binding.target === "string" && typeof binding.token === "string") {
            tokenBindings.push({ target: binding.target, token: binding.token });
        }
    }

    return { props, tokenBindings };
};
