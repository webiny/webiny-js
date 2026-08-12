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

const DESKTOP_WIDTH = 1440;
const MAX_ATTEMPTS = 3;

const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value));

const buildPrompt = (component: PlannedComponent): string => {
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
    return [
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
        ...component.sourceTexts.slice(0, 30).map(text => `- ${text}`)
    ].join("\n");
};

/**
 * Generate — model-backed, one component per cluster. For each planned component it crops the
 * representative section from the page screenshot, stores it as a File Manager record, and calls the
 * existing remote-components generation path with the contract encoded into the prompt and the crop as
 * a reference image. Each result is checked against the three W5 validators and retried up to a fixed
 * limit. Generated components stay inside the job — Promote moves them to the Library.
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

        // Valid css variables for the token validator — degrade to no token check if the theme is gone.
        let validVariables = new Set<string>();
        const manifestResult = await this.manifestResolver.resolve(
            context.job.themeEntryId,
            context.job.themeVersion
        );
        if (manifestResult.isOk()) {
            validVariables = new Set(
                manifestResult.value.slots.flatMap(slot =>
                    slot.cssVariables.map(variable => variable.toLowerCase())
                )
            );
        }

        const components: GeneratedComponent[] = [];
        const failed: string[] = [];

        for (const planned of plan.components) {
            const fileId = await this.createReferenceImage(context, planned);
            const additionalFileIds = fileId ? [fileId] : [];
            let best: GeneratedComponent | null = null;
            let attempts = 0;

            while (attempts < MAX_ATTEMPTS) {
                attempts++;
                const generated = await this.generateComponent.execute({
                    prompt: buildPrompt(planned),
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
                    textPreservation: validateTextPreservation(planned.sourceTexts, output.source),
                    contractConformance: validateContractConformance(
                        planned.props.map(prop => prop.name),
                        output.source
                    ),
                    tokenBinding: validateTokenBinding(output.css, validVariables)
                };

                best = {
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

                if (
                    validation.textPreservation.passed &&
                    validation.contractConformance.passed &&
                    validation.tokenBinding.passed
                ) {
                    break;
                }
                await context.log.info({
                    message: `"${planned.name}" attempt ${attempts} failed validation; retrying.`
                });
            }

            if (!best) {
                failed.push(planned.signature);
                await context.log.error({
                    message: `"${planned.name}" produced no output after ${MAX_ATTEMPTS} attempts.`
                });
                continue;
            }

            components.push(best);
            const passed =
                best.validation.textPreservation.passed &&
                best.validation.contractConformance.passed &&
                best.validation.tokenBinding.passed;
            if (!passed) {
                failed.push(planned.signature);
            }
        }

        const artifact: GenerateArtifact = { components, failed };
        const key = context.artifactKey("components");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        await context.log.info({
            message: `Generated ${components.length} component(s); ${failed.length} did not pass validation.`
        });
        return Result.ok({
            artifacts: { components: key },
            counts: { components: components.length },
            degraded: failed
        });
    }

    /** Crop the representative section from the page screenshot and store it as a File Manager record. */
    private async createReferenceImage(
        context: StageContext,
        planned: PlannedComponent
    ): Promise<string | null> {
        const crop = planned.representativeCrop;
        if (!crop.screenshotRef) {
            return null;
        }
        const shotResult = await context.blobs.get(crop.screenshotRef);
        if (shotResult.isFail()) {
            await context.log.error({
                message: `Could not read the screenshot for "${planned.name}".`
            });
            return null;
        }

        try {
            // `sharp` is a native module from a Lambda layer present only on the background-task
            // runtime (where this stage executes), not on the GraphQL Lambda that imports this feature
            // to build its schema — so it is loaded lazily at call time, never at module import.
            const sharp = (await import("sharp")).default;
            const bytes = shotResult.value;
            // The screenshot was downscaled from the 1440-wide capture; scale the document-space box to it.
            const meta = await sharp(bytes).metadata();
            const imageWidth = meta.width ?? DESKTOP_WIDTH;
            const imageHeight = meta.height ?? 0;
            const scale = imageWidth / DESKTOP_WIDTH;
            const left = clamp(Math.round(crop.box.x * scale), 0, Math.max(0, imageWidth - 1));
            const top = clamp(Math.round(crop.box.y * scale), 0, Math.max(0, imageHeight - 1));
            const width = clamp(Math.round(crop.box.width * scale), 1, imageWidth - left);
            const height = clamp(Math.round(crop.box.height * scale), 1, imageHeight - top);
            const cropped = await sharp(bytes)
                .extract({ left, top, width, height })
                .png()
                .toBuffer();

            const tenant = this.tenantContext.getTenant().id;
            const fileKey = `component-extraction/${context.run.id}/${randomUUID()}.png`;
            await createS3().send(
                new PutObjectCommand({
                    Bucket: String(process.env.S3_BUCKET),
                    Key: `tenants/${tenant}/files/${fileKey}`,
                    Body: cropped,
                    ContentType: "image/png"
                })
            );

            const created = await this.createFile.execute({
                key: fileKey,
                size: cropped.length,
                type: "image/png",
                name: `${planned.name} reference`
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
