import type { GenerationEffort } from "@webiny/remote-components/api/features/generateComponent/abstractions.js";
import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { GenerateRemoteComponentUseCase } from "@webiny/remote-components/api/features/generateComponent/abstractions.js";
import { CreateFileUseCase } from "@webiny/api-file-manager/features/file/CreateFile/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GENERATE_COMPONENT_TASK_ID } from "~/constants.js";
import { RunRepository, JobRepository } from "~/domain/abstractions.js";
import { StageArtifactStore, BlobStore } from "~/domain/stage.js";
import { ModelCallScope } from "~/features/shared/modelCallScope.js";
import { ThemeManifestResolver } from "~/features/shared/themeManifest.js";
import type { PlanArtifact } from "~/domain/artifacts.js";
import {
    generateComponentAttempts,
    generateResultKey,
    withRoleAwareTypeTokens,
    type ComponentResult
} from "./componentGeneration.js";
import { hasRecordedResult, recordResultOnce } from "./recordResultOnce.js";
import { replaceGeneratedComponent } from "./replaceGeneratedComponent.js";
import { loadRepresentativeNode } from "./representativeNode.js";
import { systemPromptOverride, type SystemPromptOverride } from "./themeVocabulary.js";
import { sectionSpacing } from "~/features/stages/plan/sectionSpacing.js";
import { appendGenerationLog, readGenerationPrompt } from "./generationLog.js";

// Left at the end of the invocation to write the result after the last attempt.
const DEADLINE_MARGIN_MS = 20 * 1000;

export interface GenerateComponentTaskInput {
    runId: string;
    /** The structural signature of the planned component to generate. */
    signature: string;
    /** The Generate stage version, so the result and reference-image keys line up with the coordinator. */
    stageVersion: number;
    /** The effective Plan artifact key, so the child generates exactly what the coordinator planned. */
    planRef: string;
    /**
     * Generate again and replace the component in a Generate stage that has finished — set by the
     * selected-components action, never by the coordinator. The recorded result is not a reason to stop,
     * the new one is written over it, and the stage's aggregate is updated. A generation that produces
     * nothing leaves the existing component in place.
     */
    replaceInto?: { componentsKey: string };
    /**
     * A prompt experiment (development only): generate with the named prompt lines left out, log the
     * attempts marked as the experiment, and keep the result out of the run — no replacement, no stage
     * result. The outputs are read back from the generation log.
     */
    experiment?: { label: string; ablate: string[]; include?: string[]; effort?: GenerationEffort };
    /**
     * Install the output of this generation-log entry (of the same component) instead of calling the
     * model (development only): validated and stored like any generation. Takes an experiment's
     * attempt as the component.
     */
    installEntryId?: string;
}

type RunParams = TaskHandler.RunParams<GenerateComponentTaskInput>;
type RunResult = Promise<TaskHandler.Result<GenerateComponentTaskInput>>;

/**
 * Generate ONE planned component (the Generate fan-out unit). The Generate stage triggers one of these
 * per component with bounded concurrency; each runs independently — its own task, its own logs — and
 * writes its result to a per-component artifact the coordinator polls and aggregates. Isolation: a slow
 * or failing component can't block the rest, and a lost child is retried or given up on by the coordinator.
 */
class GenerateComponentTaskHandlerImpl implements TaskHandler.Interface<GenerateComponentTaskInput> {
    constructor(
        readonly runRepository: RunRepository.Interface,
        readonly jobRepository: JobRepository.Interface,
        readonly artifactStore: StageArtifactStore.Interface,
        readonly blobs: BlobStore.Interface,
        readonly generateComponent: GenerateRemoteComponentUseCase.Interface,
        readonly createFile: CreateFileUseCase.Interface,
        readonly tenantContext: TenantContext.Interface,
        readonly manifestResolver: ThemeManifestResolver.Interface,
        readonly modelCallScope: ModelCallScope.Interface
    ) {}

    async run({ input, controller }: RunParams): RunResult {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }
        const log = controller.logger;
        const resultKey = generateResultKey(input.runId, input.stageVersion, input.signature);
        // The end of this invocation, less a margin to write the result: the attempts must be over by then.
        const deadline =
            Date.now() + controller.runtime.getRemainingMilliseconds() - DEADLINE_MARGIN_MS;

        // Another task already finished this component — a retrigger that overlapped a slow original.
        if (
            !input.replaceInto &&
            !input.experiment &&
            (await hasRecordedResult(this.artifactStore, resultKey))
        ) {
            return controller.response.done("This component's result is already recorded.");
        }

        const runResult = await this.runRepository.get(input.runId);
        if (runResult.isFail()) {
            return controller.response.error(runResult.error.message);
        }
        const jobResult = await this.jobRepository.get(runResult.value.jobId);
        if (jobResult.isFail()) {
            return controller.response.error(jobResult.error.message);
        }
        const job = jobResult.value;

        const planResult = await this.artifactStore.getJson<PlanArtifact>(input.planRef);
        if (planResult.isFail() || !planResult.value) {
            return controller.response.error("The plan artifact could not be read.");
        }
        const planned = planResult.value.components.find(
            component => component.signature === input.signature
        );
        if (!planned) {
            // Nothing to generate for a signature the plan no longer has — record an empty result so the
            // coordinator sees this component as resolved rather than waiting on it forever.
            await this.artifactStore.putJson(resultKey, {
                signature: input.signature,
                component: null,
                revision: 1
            } satisfies ComponentResult);
            return controller.response.done("Planned component not found; nothing to generate.");
        }

        // Resolve the theme's css variables for token-binding validation (skipped if unresolved, exactly
        // as the inline stage did — otherwise every var(--wby-*) counts as unknown and all fail).
        const slotVariables = new Map<string, string[]>();
        let validVariables = new Set<string>();
        let manifestAvailable = false;
        const manifest = await this.manifestResolver.resolve(job.themeEntryId, job.themeVersion);
        let promptPlanned = planned;
        let systemOverride: SystemPromptOverride | undefined;
        if (manifest.isOk()) {
            manifestAvailable = true;
            promptPlanned = withRoleAwareTypeTokens(planned, manifest.value);
            systemOverride = systemPromptOverride(manifest.value);
            for (const slot of manifest.value.slots) {
                slotVariables.set(String(slot.path), slot.cssVariables);
            }
            validVariables = new Set(
                [...slotVariables.values()].flat().map(variable => variable.toLowerCase())
            );
        } else {
            await log.info({
                message: `Generating "${planned.name}" without token-binding validation: ${manifest.error.message}`
            });
        }

        // The section's measured spacing, from its captured tree. Measured here rather than in Plan so
        // stored plans get it too; a section that cannot be read goes without, as before.
        const sectionNode = await loadRepresentativeNode(
            { store: this.artifactStore, blobs: this.blobs },
            runResult.value.stages,
            planned
        );
        if (sectionNode) {
            promptPlanned = {
                ...promptPlanned,
                spacing: sectionSpacing(sectionNode, manifest.isOk() ? manifest.value : null)
            };
        } else {
            await log.info({
                message: `"${planned.name}": its section's captured tree could not be read; generating without measured spacing.`
            });
        }

        let install: { source: string; css: string } | undefined;
        if (input.installEntryId) {
            const logged = await readGenerationPrompt(this.artifactStore, this.blobs, {
                runId: input.runId,
                signature: input.signature,
                entryId: input.installEntryId
            });
            const output = logged.isOk() ? logged.value?.output : undefined;
            if (!output) {
                return controller.response.error(
                    `Generation-log entry ${input.installEntryId} has no output to install.`
                );
            }
            install = output;
        }

        // Run inside the generate model-call scope so the child's model calls (via remote-components) are
        // attributed to the run's Generate stage — exactly as the inline stage did — keeping the token
        // panel's per-stage accounting correct now that the calls happen in per-component child tasks.
        const outcome = await this.modelCallScope.run(
            {
                runId: input.runId,
                stage: "generate",
                stageVersion: input.stageVersion,
                signature: input.signature
            },
            () =>
                generateComponentAttempts(
                    {
                        generateComponent: this.generateComponent,
                        createFile: this.createFile,
                        tenantContext: this.tenantContext,
                        blobs: this.blobs
                    },
                    {
                        runId: input.runId,
                        stageVersion: input.stageVersion,
                        planned: promptPlanned,
                        ...(systemOverride ? { systemOverride } : {}),
                        validVariables,
                        manifestAvailable,
                        slotVariables,
                        ...(input.experiment ? { ablate: input.experiment.ablate } : {}),
                        ...(input.experiment?.include ? { include: input.experiment.include } : {}),
                        ...(input.experiment?.effort ? { effort: input.experiment.effort } : {}),
                        ...(install ? { install } : {}),
                        log: (message, error) =>
                            log.error({ message, ...(error instanceof Error ? { error } : {}) }),
                        beat: message => log.info({ message }),
                        deadline,
                        recordAttempt: async record => {
                            const appended = await appendGenerationLog(
                                this.artifactStore,
                                this.blobs,
                                {
                                    runId: input.runId,
                                    signature: input.signature,
                                    stageVersion: input.stageVersion,
                                    trigger: input.experiment
                                        ? "experiment"
                                        : install
                                          ? "install"
                                          : input.replaceInto
                                            ? "generate-again"
                                            : "generate",
                                    record,
                                    ...(input.experiment ? { experiment: input.experiment } : {})
                                }
                            );
                            if (appended.isFail()) {
                                await log.error({
                                    message: `Could not write the generation log for "${planned.name}": ${appended.error.message}`
                                });
                            }
                        }
                    }
                )
        );

        const { component, notGenerated } = outcome;

        if (input.experiment) {
            return controller.response.done(
                `Experiment "${input.experiment.label}" on "${planned.name}": ${component ? "generated" : (notGenerated ?? "no output")}; the run is unchanged.`
            );
        }

        if (input.replaceInto) {
            if (!component) {
                return controller.response.done(
                    `"${planned.name}" was not regenerated (${notGenerated ?? "no output"}); the existing component is unchanged.`
                );
            }
            const replaced = await replaceGeneratedComponent(this.artifactStore, {
                runId: input.runId,
                stageVersion: input.stageVersion,
                componentsKey: input.replaceInto.componentsKey,
                component
            });
            if (replaced.isFail()) {
                return controller.response.error(replaced.error.message);
            }
            return controller.response.done(
                `Regenerated "${planned.name}" (revision ${replaced.value.revision}).`
            );
        }

        const written = await recordResultOnce(this.artifactStore, resultKey, {
            signature: input.signature,
            component,
            revision: 1,
            ...(notGenerated ? { notGenerated } : {})
        } satisfies ComponentResult);
        if (written.isFail()) {
            return controller.response.error(written.error.message);
        }
        if (written.value === "already-recorded") {
            return controller.response.done(
                `"${planned.name}": another task recorded this component first; this result was discarded.`
            );
        }

        return controller.response.done(
            component
                ? `Generated "${planned.name}".`
                : notGenerated
                  ? `"${planned.name}" not generated: ${notGenerated}.`
                  : `"${planned.name}" produced no output.`
        );
    }
}

const GenerateComponentTaskHandler = TaskHandler.createImplementation({
    implementation: GenerateComponentTaskHandlerImpl,
    dependencies: [
        RunRepository,
        JobRepository,
        StageArtifactStore,
        BlobStore,
        GenerateRemoteComponentUseCase,
        CreateFileUseCase,
        TenantContext,
        ThemeManifestResolver,
        ModelCallScope
    ]
});

class GenerateComponentTaskImpl implements TaskDefinition.Interface<GenerateComponentTaskInput> {
    readonly id = GENERATE_COMPONENT_TASK_ID;
    readonly title = "Component extraction — generate component";
    readonly description = "Generates a single component from its planned contract.";
    readonly maxIterations = 1;
    // Not private: each per-component generation is its own visible task in the Background Tasks viewer.
    readonly isPrivate = false;
    readonly databaseLogs = true;

    readonly handler = GenerateComponentTaskHandler;
}

export const GenerateComponentTask = TaskDefinition.createImplementation({
    implementation: GenerateComponentTaskImpl,
    dependencies: []
});
