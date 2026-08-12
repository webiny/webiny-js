import { Result } from "@webiny/feature/api";
import type { ThemeManifest } from "@webiny/theme-common";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type {
    ClassifiedCluster,
    ClassifyArtifact,
    ComponentProp,
    PlanArtifact,
    PlannedComponent,
    TokenBinding
} from "~/domain/artifacts.js";
import { ComponentExtractionAi } from "~/features/shared/ai.js";
import { ThemeManifestResolver } from "~/features/shared/themeManifest.js";
import { extractJson } from "~/features/shared/parseJson.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

const SYSTEM =
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

const buildPrompt = (cluster: ClassifiedCluster, manifest: ThemeManifest | null): string => {
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

const parseContract = (
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

/**
 * Plan — model-backed. For each cluster, proposes a component contract: props (name, type, observed
 * values) and token bindings resolved against the theme manifest. This is the gate where cost starts,
 * so the run records the resulting component count. A missing provider fails the stage; a per-component
 * model error skips that component.
 */
class PlanHandlerImpl implements StageHandler.Interface {
    readonly stage = "plan" as const;

    constructor(
        private ai: ComponentExtractionAi.Interface,
        private manifestResolver: ThemeManifestResolver.Interface
    ) {}

    async execute(context: StageContext): Promise<Result<StageOutcome, ExtractionError>> {
        const classifyRef = context.upstream.classifications;
        if (!classifyRef) {
            return Result.fail(new ExtractionValidationError("no classified clusters to plan"));
        }
        const classifyResult = await context.store.getJson<ClassifyArtifact>(classifyRef);
        if (classifyResult.isFail()) {
            return Result.fail(classifyResult.error);
        }
        const classify = classifyResult.value;
        if (!classify) {
            return Result.fail(new ExtractionValidationError("the classify artifact is empty"));
        }

        let manifest: ThemeManifest | null = null;
        const manifestResult = await this.manifestResolver.resolve(
            context.job.themeEntryId,
            context.job.themeVersion
        );
        if (manifestResult.isOk()) {
            manifest = manifestResult.value;
        } else {
            await context.log.info({
                message: `Planning without token bindings: ${manifestResult.error.message}`
            });
        }

        const components: PlannedComponent[] = [];
        for (const cluster of classify.clusters) {
            const aiResult = await this.ai.generate({
                system: SYSTEM,
                messages: [{ role: "user", content: buildPrompt(cluster, manifest) }]
            });
            if (aiResult.isFail()) {
                if (aiResult.error.code === "ComponentExtraction/ValidationError") {
                    return Result.fail(aiResult.error);
                }
                await context.log.error({
                    message: `Plan failed for "${cluster.name}": ${aiResult.error.message}`
                });
                continue;
            }

            const contract = parseContract(aiResult.value);
            if (!contract) {
                await context.log.error({
                    message: `Plan returned no usable contract for "${cluster.name}".`
                });
                continue;
            }

            components.push({
                signature: cluster.cluster.signature,
                name: cluster.name,
                type: cluster.type,
                props: contract.props,
                tokenBindings: contract.tokenBindings,
                representative: cluster.cluster.representative,
                members: cluster.cluster.members
            });
        }

        const artifact: PlanArtifact = { components };
        const key = context.artifactKey("plan");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        await context.log.info({ message: `Planned ${components.length} component(s).` });
        return Result.ok({ artifacts: { plan: key }, counts: { components: components.length } });
    }
}

export const PlanHandler = StageHandler.createImplementation({
    implementation: PlanHandlerImpl,
    dependencies: [ComponentExtractionAi, ThemeManifestResolver]
});
