import { Result } from "@webiny/feature/api";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type {
    ClassifiedCluster,
    ClassifyArtifact,
    ClusterArtifact,
    SectionDigest
} from "~/domain/artifacts.js";
import { ComponentExtractionAi } from "~/features/shared/ai.js";
import { extractJson } from "~/features/shared/parseJson.js";
import { descriptiveName } from "~/features/stages/cluster/digest.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

const CONFIDENCE_THRESHOLD = 0.6;
// One model call per cluster; yield with this much runway so a call never straddles the Lambda timeout.
const CLASSIFY_SAFETY_MARGIN_SECONDS = 120;

/** Resumable checkpoint: how far through the clusters we are, and the classifications so far. */
interface ClassifyCheckpoint {
    nextIndex: number;
    classified: ClassifiedCluster[];
    unclassifiedCount: number;
}
const TAXONOMY =
    "hero, features, cta, testimonial, pricing, faq, header, footer, gallery, stats, logos, form, content, other";
const SYSTEM =
    "You classify website sections into a component taxonomy. Respond ONLY with a JSON object, no prose.";

const buildPrompt = (digest: SectionDigest): string =>
    [
        "Classify this website section into one taxonomy type.",
        `Structure: ${digest.structure}`,
        `Headings: ${digest.headingCount}, Images: ${digest.imageCount}, Links/buttons: ${digest.linkCount}`,
        "Text:",
        ...digest.texts.slice(0, 15).map(text => `- ${text}`),
        "",
        `Taxonomy: ${TAXONOMY}.`,
        'Respond with JSON: { "type": "<taxonomy>", "name": "<short component name>", "confidence": <0..1> }'
    ].join("\n");

interface ClassificationJson {
    type?: unknown;
    name?: unknown;
    confidence?: unknown;
}

const parse = (text: string): { type: string; name: string; confidence: number } | null => {
    const raw = extractJson<ClassificationJson>(text);
    if (!raw) {
        return null;
    }
    const type = typeof raw.type === "string" ? raw.type : null;
    const confidence =
        typeof raw.confidence === "number" ? Math.max(0, Math.min(1, raw.confidence)) : null;
    if (type === null || confidence === null) {
        return null;
    }
    return { type, name: typeof raw.name === "string" ? raw.name : "", confidence };
};

/**
 * Classify — model-backed. Assigns each cluster a taxonomy type, a name and a confidence. Below the
 * confidence threshold a cluster is marked unclassified but proceeds with a descriptive name. A missing
 * AI provider fails the stage; a transient per-cluster model error degrades that cluster to unclassified.
 */
class ClassifyHandlerImpl implements StageHandler.Interface {
    readonly stage = "classify" as const;

    constructor(private ai: ComponentExtractionAi.Interface) {}

    async execute(context: StageContext): Promise<Result<StageOutcome, ExtractionError>> {
        const clusterRef = context.upstream.clusters;
        if (!clusterRef) {
            return Result.fail(new ExtractionValidationError("no clusters to classify"));
        }
        const clusterResult = await context.store.getJson<ClusterArtifact>(clusterRef);
        if (clusterResult.isFail()) {
            return Result.fail(clusterResult.error);
        }
        const clusterArtifact = clusterResult.value;
        if (!clusterArtifact) {
            return Result.fail(new ExtractionValidationError("the cluster artifact is empty"));
        }

        const clusters = clusterArtifact.clusters;
        const total = clusters.length;

        // Resume from the checkpoint if this is a continuation; start fresh otherwise.
        const checkpointKey = context.artifactKey("checkpoint");
        const loaded = await context.store.getJson<ClassifyCheckpoint>(checkpointKey);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const checkpoint: ClassifyCheckpoint = loaded.value ?? {
            nextIndex: 0,
            classified: [],
            unclassifiedCount: 0
        };

        while (checkpoint.nextIndex < total) {
            const cluster = clusters[checkpoint.nextIndex];
            const aiResult = await this.ai.generate({
                system: SYSTEM,
                messages: [{ role: "user", content: buildPrompt(cluster.digest) }]
            });

            if (aiResult.isFail()) {
                if (aiResult.error.code === "ComponentExtraction/ValidationError") {
                    // A configuration problem (no provider) is not something the run can proceed past.
                    return Result.fail(aiResult.error);
                }
                await context.log.error({
                    message: `Classify failed for a cluster: ${aiResult.error.message}`
                });
                checkpoint.classified.push({
                    cluster,
                    type: "unknown",
                    name: descriptiveName(cluster.digest),
                    confidence: 0,
                    unclassified: true
                });
                checkpoint.unclassifiedCount++;
            } else {
                const parsed = parse(aiResult.value);
                if (parsed && parsed.confidence >= CONFIDENCE_THRESHOLD) {
                    checkpoint.classified.push({
                        cluster,
                        type: parsed.type,
                        name: parsed.name || descriptiveName(cluster.digest),
                        confidence: parsed.confidence,
                        unclassified: false
                    });
                } else {
                    checkpoint.classified.push({
                        cluster,
                        type: parsed?.type ?? "unknown",
                        name: parsed?.name || descriptiveName(cluster.digest),
                        confidence: parsed?.confidence ?? 0,
                        unclassified: true
                    });
                    checkpoint.unclassifiedCount++;
                }
            }

            checkpoint.nextIndex++;
            await context.progress({
                message: `Classified ${checkpoint.nextIndex}/${total} sections`,
                current: checkpoint.nextIndex,
                total
            });
            const saved = await context.store.putJson(checkpointKey, checkpoint);
            if (saved.isFail()) {
                return Result.fail(saved.error);
            }

            if (
                checkpoint.nextIndex < total &&
                context.isCloseToTimeout(CLASSIFY_SAFETY_MARGIN_SECONDS)
            ) {
                return Result.ok({ artifacts: {}, more: true });
            }
        }

        const artifact: ClassifyArtifact = { clusters: checkpoint.classified };
        const key = context.artifactKey("classifications");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        await context.log.info({
            message: `Classified ${checkpoint.classified.length} cluster(s); ${checkpoint.unclassifiedCount} unclassified.`
        });
        return Result.ok({ artifacts: { classifications: key } });
    }
}

export const ClassifyHandler = StageHandler.createImplementation({
    implementation: ClassifyHandlerImpl,
    dependencies: [ComponentExtractionAi]
});
