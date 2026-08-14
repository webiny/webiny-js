import { randomUUID } from "node:crypto";
import { Result } from "@webiny/feature/api";
import { createS3, PutObjectCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { GenerateRemoteComponentUseCase } from "@webiny/remote-components/api/features/generateComponent/abstractions.js";
import { CreateFileUseCase } from "@webiny/api-file-manager/features/file/CreateFile/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type {
    GeneratedComponent,
    GenerateArtifact,
    PlanArtifact,
    PlannedComponent
} from "~/domain/artifacts.js";
import { ThemeManifestResolver } from "~/features/shared/themeManifest.js";
import {
    validateContractConformance,
    validateTextPreservation,
    validateTokenBinding
} from "~/features/shared/validators.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

const MAX_ATTEMPTS = 3;
// How many of a section's text fragments the prompt asks the model to preserve. Text preservation is
// validated against this SAME slice — validating against text the model was never given would fail every
// text-heavy section on content it never saw.
const PRESERVED_TEXT_LIMIT = 30;
// One component can take up to MAX_ATTEMPTS model calls plus an image crop — well over a minute on a slow
// model. The margin MUST exceed that worst case: the loop only checks the timeout between components, so
// if a component starts with less runway than it needs, the Lambda is hard-killed mid-run and the stage
// is left stuck "running". Keep this comfortably above one component's worst-case duration.
const GENERATE_SAFETY_MARGIN_SECONDS = 360;

/** Resumable checkpoint: how far through the planned components we are, and the results so far. */
interface GenerateCheckpoint {
    nextIndex: number;
    components: GeneratedComponent[];
    failed: string[];
}

const buildPrompt = (component: PlannedComponent, feedback: string[] = []): string => {
    const props = component.props.map(
        prop =>
            `- ${prop.name} (${prop.type})${
                prop.observedValues.length
                    ? `: e.g. ${prop.observedValues.slice(0, 3).join(" | ")}`
                    : ""
            }`
    );
    const bindings = component.tokenBindings.map(
        binding => `- ${binding.target} -> ${binding.token}`
    );
    const lines = [
        `Build a "${component.type}" website section component named "${component.name}".`,
        "Reproduce the section shown in the reference image.",
        "",
        "It must expose exactly these editable props (use these prop names):",
        ...(props.length ? props : ["- (no props; static content)"]),
        "",
        "Bind visual styles to the theme, using var(--wby-...) for the following:",
        ...(bindings.length
            ? bindings
            : ["- use semantic theme tokens for colours, spacing and type"]),
        "",
        "Preserve this text content exactly:",
        ...component.sourceTexts.slice(0, PRESERVED_TEXT_LIMIT).map(text => `- ${text}`)
    ];
    // On a retry, tell the model precisely what the previous attempt got wrong so it can fix that rather
    // than re-rolling blindly — the single biggest lever on both pass rate and wasted attempts.
    if (feedback.length > 0) {
        lines.push(
            "",
            "Your previous attempt was rejected by automated validation. Fix EXACTLY these issues and keep everything that was already correct:",
            ...feedback.map(item => `- ${item}`)
        );
    }
    return lines.join("\n");
};

/** Whether two attempts produced the same set of validation failures (so a retry made no progress). */
const sameFailures = (a: string[], b: string[]): boolean => {
    if (a.length !== b.length) {
        return false;
    }
    const seen = new Set(a);
    return b.every(item => seen.has(item));
};

/**
 * The retry instructions for the next attempt: the failures verbatim, plus — when the model invented
 * token variables — the actual valid ones to choose from (it cannot guess exact names).
 */
const buildRetryFeedback = (failures: string[], validVariables: Set<string>): string[] => {
    const feedback = [...failures];
    if (
        failures.some(item => item.startsWith("unknown token variable")) &&
        validVariables.size > 0
    ) {
        feedback.push(
            `Use ONLY these theme CSS variables (no others): ${[...validVariables]
                .slice(0, 60)
                .join(", ")}`
        );
    }
    return feedback;
};

/**
 * Generate — model-backed, one component per cluster. For each planned component it copies the section
 * crop Segment already produced into a File Manager record, and calls the existing remote-components
 * generation path with the contract encoded into the prompt and the crop as a reference image. Each
 * result is checked against the three W5 validators and retried up to a fixed limit. Generated
 * components stay inside the job — Promote moves them to the Library.
 */
class GenerateHandlerImpl implements StageHandler.Interface {
    readonly stage = "generate" as const;

    constructor(
        private generateComponent: GenerateRemoteComponentUseCase.Interface,
        private createFile: CreateFileUseCase.Interface,
        private tenantContext: TenantContext.Interface,
        private manifestResolver: ThemeManifestResolver.Interface
    ) {}

    async execute(context: StageContext): Promise<Result<StageOutcome, ExtractionError>> {
        const planRef = context.upstream.plan;
        if (!planRef) {
            return Result.fail(new ExtractionValidationError("no plan to generate from"));
        }
        const planResult = await context.store.getJson<PlanArtifact>(planRef);
        if (planResult.isFail()) {
            return Result.fail(planResult.error);
        }
        const plan = planResult.value;
        if (!plan) {
            return Result.fail(new ExtractionValidationError("the plan artifact is empty"));
        }

        // Valid css variables for the token validator. If the theme manifest can't be resolved (e.g. an
        // unpublished theme), token binding is NOT checked — otherwise every `var(--wby-*)` the model
        // emits counts as unknown and every component fails validation, and Promote skips them all.
        let validVariables = new Set<string>();
        let manifestAvailable = false;
        const manifestResult = await this.manifestResolver.resolve(
            context.job.themeEntryId,
            context.job.themeVersion
        );
        if (manifestResult.isOk()) {
            manifestAvailable = true;
            validVariables = new Set(
                manifestResult.value.slots.flatMap(slot =>
                    slot.cssVariables.map(variable => variable.toLowerCase())
                )
            );
        } else {
            await context.log.info({
                message: `Generating without token-binding validation: ${manifestResult.error.message}`
            });
        }

        const total = plan.components.length;

        // Resume from the checkpoint if this is a continuation; start fresh otherwise.
        const checkpointKey = context.artifactKey("checkpoint");
        const loaded = await context.store.getJson<GenerateCheckpoint>(checkpointKey);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const checkpoint: GenerateCheckpoint = loaded.value ?? {
            nextIndex: 0,
            components: [],
            failed: []
        };

        while (checkpoint.nextIndex < total) {
            const planned = plan.components[checkpoint.nextIndex];
            const best = await this.generateOne(
                context,
                planned,
                validVariables,
                manifestAvailable
            );

            if (!best) {
                checkpoint.failed.push(planned.signature);
                await context.log.error({
                    message: `"${planned.name}" produced no output after ${MAX_ATTEMPTS} attempts.`
                });
            } else {
                checkpoint.components.push(best);
                const passed =
                    best.validation.textPreservation.passed &&
                    best.validation.contractConformance.passed &&
                    best.validation.tokenBinding.passed;
                if (!passed) {
                    checkpoint.failed.push(planned.signature);
                }
            }

            checkpoint.nextIndex++;
            await context.progress({
                message: `Generated ${checkpoint.nextIndex}/${total} components (${planned.name})`,
                current: checkpoint.nextIndex,
                total
            });
            const saved = await context.store.putJson(checkpointKey, checkpoint);
            if (saved.isFail()) {
                return Result.fail(saved.error);
            }

            if (
                checkpoint.nextIndex < total &&
                context.isCloseToTimeout(GENERATE_SAFETY_MARGIN_SECONDS)
            ) {
                return Result.ok({
                    artifacts: {},
                    counts: { components: checkpoint.components.length },
                    more: true
                });
            }
        }

        const artifact: GenerateArtifact = {
            components: checkpoint.components,
            failed: checkpoint.failed
        };
        const key = context.artifactKey("components");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        await context.log.info({
            message: `Generated ${checkpoint.components.length} component(s); ${checkpoint.failed.length} did not pass validation.`
        });
        return Result.ok({
            artifacts: { components: key },
            counts: { components: checkpoint.components.length },
            degraded: checkpoint.failed
        });
    }

    /** Generate one component: crop the reference, then generate + validate up to `MAX_ATTEMPTS` times. */
    private async generateOne(
        context: StageContext,
        planned: PlannedComponent,
        validVariables: Set<string>,
        manifestAvailable: boolean
    ): Promise<GeneratedComponent | null> {
        const fileId = await this.createReferenceImage(context, planned);
        const additionalFileIds = fileId ? [fileId] : [];
        let best: GeneratedComponent | null = null;
        let bestFailureCount = Number.POSITIVE_INFINITY;
        // The prior attempt's failures, fed into the next prompt so a retry is a targeted fix. Null on
        // the first attempt (no feedback yet).
        let previousFailures: string[] | null = null;
        let attempts = 0;

        while (attempts < MAX_ATTEMPTS) {
            attempts++;
            const feedback = previousFailures
                ? buildRetryFeedback(previousFailures, validVariables)
                : [];
            const generated = await this.generateComponent.execute({
                prompt: buildPrompt(planned, feedback),
                name: planned.name,
                additionalFileIds
            });
            if (generated.isFail()) {
                await context.log.error({
                    message: `Generate attempt ${attempts} failed for "${planned.name}": ${generated.error.message}`
                });
                continue;
            }

            const output = generated.value;
            const validation = {
                textPreservation: validateTextPreservation(
                    planned.sourceTexts.slice(0, PRESERVED_TEXT_LIMIT),
                    output.source
                ),
                contractConformance: validateContractConformance(
                    planned.props.map(prop => prop.name),
                    output.source
                ),
                tokenBinding: manifestAvailable
                    ? validateTokenBinding(output.css, validVariables)
                    : {
                          passed: true,
                          failures: ["theme manifest unavailable; token binding not checked"]
                      }
            };
            const failures = [
                ...(validation.textPreservation.passed ? [] : validation.textPreservation.failures),
                ...(validation.contractConformance.passed
                    ? []
                    : validation.contractConformance.failures),
                ...(validation.tokenBinding.passed ? [] : validation.tokenBinding.failures)
            ];

            const candidate: GeneratedComponent = {
                signature: planned.signature,
                name: planned.name,
                type: planned.type,
                source: output.source,
                css: output.css,
                props: planned.props,
                tokenBindings: planned.tokenBindings,
                members: planned.members,
                attempts,
                validation
            };
            // Keep the least-broken attempt, not merely the last — an informed retry can still regress.
            if (failures.length < bestFailureCount) {
                best = candidate;
                bestFailureCount = failures.length;
            }

            if (failures.length === 0) {
                break;
            }
            // Stop early when a retry made no progress: identical failures mean the feedback isn't
            // landing, so another attempt would just burn tokens for the same result.
            if (previousFailures && sameFailures(previousFailures, failures)) {
                await context.log.info({
                    message: `"${planned.name}" not converging after ${attempts} attempt(s); stopping early.`
                });
                break;
            }
            previousFailures = failures;
            await context.log.info({
                message: `"${planned.name}" attempt ${attempts} failed validation; retrying with feedback.`
            });
        }

        // Report the total attempts actually spent (the token cost), even when an earlier one was kept.
        return best ? { ...best, attempts } : null;
    }

    /**
     * The reference image for the model: the section crop Segment already produced. Copied into a File
     * Manager record so the remote-components generation path can attach it. No cropping here — Segment
     * is the single place that reads the screenshot and derives crops.
     */
    private async createReferenceImage(
        context: StageContext,
        planned: PlannedComponent
    ): Promise<string | null> {
        const cropRef = planned.representativeCrop.cropRef;
        if (!cropRef) {
            return null;
        }
        const cropResult = await context.blobs.get(cropRef);
        if (cropResult.isFail()) {
            await context.log.error({
                message: `Could not read the section crop for "${planned.name}".`
            });
            return null;
        }

        try {
            const bytes = Buffer.from(cropResult.value);
            const tenant = this.tenantContext.getTenant().id;
            const fileKey = `component-extraction/${context.run.id}/${randomUUID()}.png`;
            await createS3().send(
                new PutObjectCommand({
                    Bucket: String(process.env.S3_BUCKET),
                    Key: `tenants/${tenant}/files/${fileKey}`,
                    Body: bytes,
                    ContentType: "image/png"
                })
            );

            const created = await this.createFile.execute({
                key: fileKey,
                size: bytes.length,
                type: "image/png",
                name: `${planned.name} reference`,
                // This is a machine input for the generation call, not a media-library asset — skip the
                // AI image enrichment (description/tag extraction), which would be wasted model calls.
                metadata: { aiImageEnrichment: false }
            });
            if (created.isFail()) {
                await context.log.error({
                    message: `Could not create the reference file for "${planned.name}": ${created.error.message}`
                });
                return null;
            }
            return created.value.id;
        } catch (error) {
            await context.log.error({
                message: `Could not build the reference image for "${planned.name}".`,
                error
            });
            return null;
        }
    }
}

export const GenerateHandler = StageHandler.createImplementation({
    implementation: GenerateHandlerImpl,
    dependencies: [
        GenerateRemoteComponentUseCase,
        CreateFileUseCase,
        TenantContext,
        ThemeManifestResolver
    ]
});
