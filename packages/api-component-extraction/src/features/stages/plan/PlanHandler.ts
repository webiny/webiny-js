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
// One model call per cluster. The margin MUST exceed one call's worst case: the timeout is checked only
// between clusters, so too small a margin lets a call start without runway and the Lambda is hard-killed
// mid-call, leaving the stage stuck "running".
const PLAN_SAFETY_MARGIN_SECONDS = 180;

/** Resumable checkpoint: how far through the clusters we are, and the planned components so far. */
interface PlanCheckpoint {
    nextIndex: number;
    components: PlannedComponent[];
}

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

        const clusters = classify.clusters;
        const total = clusters.length;

        // Resume from the checkpoint if this is a continuation; start fresh otherwise.
        const checkpointKey = context.artifactKey("checkpoint");
        const loaded = await context.store.getJson<PlanCheckpoint>(checkpointKey);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const checkpoint: PlanCheckpoint = loaded.value ?? { nextIndex: 0, components: [] };

        while (checkpoint.nextIndex < total) {
            const cluster = clusters[checkpoint.nextIndex];
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
            } else {
                const contract = parseContract(aiResult.value);
                if (!contract) {
                    await context.log.error({
                        message: `Plan returned no usable contract for "${cluster.name}".`
                    });
                } else {
                    checkpoint.components.push({
                        signature: cluster.cluster.signature,
                        name: cluster.name,
                        type: cluster.type,
                        props: contract.props,
                        tokenBindings: contract.tokenBindings,
                        representative: cluster.cluster.representative,
                        members: cluster.cluster.members,
                        representativeCrop: cluster.cluster.representativeCrop,
                        sourceTexts: cluster.cluster.observedTexts
                    });
                }
            }

            checkpoint.nextIndex++;
            await context.progress({
                message: `Planned ${checkpoint.nextIndex}/${total} sections`,
                current: checkpoint.nextIndex,
                total
            });
            const saved = await context.store.putJson(checkpointKey, checkpoint);
            if (saved.isFail()) {
                return Result.fail(saved.error);
            }

            if (
                checkpoint.nextIndex < total &&
                context.isCloseToTimeout(PLAN_SAFETY_MARGIN_SECONDS)
            ) {
                return Result.ok({
                    artifacts: {},
                    counts: { components: checkpoint.components.length },
                    more: true
                });
            }
        }

        const artifact: PlanArtifact = { components: checkpoint.components };
        const key = context.artifactKey("plan");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        await context.log.info({
            message: `Planned ${checkpoint.components.length} component(s).`
        });
        return Result.ok({
            artifacts: { plan: key },
            counts: { components: checkpoint.components.length }
        });
    }
}

export const PlanHandler = StageHandler.createImplementation({
    implementation: PlanHandlerImpl,
    dependencies: [ComponentExtractionAi, ThemeManifestResolver]
});
