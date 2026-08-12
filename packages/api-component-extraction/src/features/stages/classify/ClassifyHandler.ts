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

        const classified: ClassifiedCluster[] = [];
        let unclassifiedCount = 0;

        for (const cluster of clusterArtifact.clusters) {
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
                classified.push({
                    cluster,
                    type: "unknown",
                    name: descriptiveName(cluster.digest),
                    confidence: 0,
                    unclassified: true
                });
                unclassifiedCount++;
                continue;
            }

            const parsed = parse(aiResult.value);
            if (parsed && parsed.confidence >= CONFIDENCE_THRESHOLD) {
                classified.push({
                    cluster,
                    type: parsed.type,
                    name: parsed.name || descriptiveName(cluster.digest),
                    confidence: parsed.confidence,
                    unclassified: false
                });
            } else {
                classified.push({
                    cluster,
                    type: parsed?.type ?? "unknown",
                    name: parsed?.name || descriptiveName(cluster.digest),
                    confidence: parsed?.confidence ?? 0,
                    unclassified: true
                });
                unclassifiedCount++;
            }
        }

        const artifact: ClassifyArtifact = { clusters: classified };
        const key = context.artifactKey("classifications");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        await context.log.info({
            message: `Classified ${classified.length} cluster(s); ${unclassifiedCount} unclassified.`
        });
        return Result.ok({ artifacts: { classifications: key } });
    }
}

export const ClassifyHandler = StageHandler.createImplementation({
    implementation: ClassifyHandlerImpl,
    dependencies: [ComponentExtractionAi]
});
