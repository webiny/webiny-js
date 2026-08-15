import type { ThemeManifest } from "@webiny/theme-common";
import type { ClassifiedCluster, ComponentProp, TokenBinding } from "~/domain/artifacts.js";
import { extractJson } from "~/features/shared/parseJson.js";

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
    manifest: ThemeManifest | null
): string => {
    const digest = cluster.cluster.digest;
    return [
        `Propose a component contract for this "${cluster.type}" section named "${cluster.name}".`,
        `Structure: ${digest.structure}`,
        `Counts: headings ${digest.headingCount}, images ${digest.imageCount}, links/buttons ${digest.linkCount}`,
        "Text observed across instances:",
        ...cluster.cluster.observedTexts.slice(0, 20).map(text => `- ${text}`),
        "",
        "Available theme tokens (bind visual props to these slot paths):",
        slotLines(manifest),
        "",
        "Respond with JSON:",
        '{ "props": [ { "name": "...", "type": "text|richText|image|url|boolean", "observedValues": ["..."] } ],',
        '  "tokenBindings": [ { "target": "<prop or element>", "token": "<slot path>" } ] }'
    ].join("\n");
};

interface ContractJson {
    props?: unknown;
    tokenBindings?: unknown;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
    value && typeof value === "object" ? (value as Record<string, unknown>) : null;

export const parsePlanContract = (
    text: string
): { props: ComponentProp[]; tokenBindings: TokenBinding[] } | null => {
    const raw = extractJson<ContractJson>(text);
    if (!raw) {
        return null;
    }

    const props: ComponentProp[] = [];
    for (const item of Array.isArray(raw.props) ? (raw.props as unknown[]) : []) {
        const prop = asRecord(item);
        if (prop && typeof prop.name === "string" && typeof prop.type === "string") {
            const values = Array.isArray(prop.observedValues)
                ? (prop.observedValues as unknown[])
                      .filter((value): value is string => typeof value === "string")
                      .slice(0, 10)
                : [];
            props.push({ name: prop.name, type: prop.type, observedValues: values });
        }
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
