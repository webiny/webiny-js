import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
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
    type ComponentResult
} from "./componentGeneration.js";

export interface GenerateComponentTaskInput {
    runId: string;
    /** The structural signature of the planned component to generate. */
    signature: string;
    /** The Generate stage version, so the result and reference-image keys line up with the coordinator. */
    stageVersion: number;
    /** The effective Plan artifact key, so the child generates exactly what the coordinator planned. */
    planRef: string;
}

type RunParams = TaskDefinition.RunParams<GenerateComponentTaskInput>;
type RunResult = Promise<TaskDefinition.Result<GenerateComponentTaskInput>>;

/**
 * Generate ONE planned component (the Generate fan-out unit). The Generate stage triggers one of these
 * per component with bounded concurrency; each runs independently — its own task, its own logs — and
 * writes its result to a per-component artifact the coordinator polls and aggregates. Isolation: a slow
 * or failing component can't block the rest, and a lost child is retried or given up on by the coordinator.
 */
class GenerateComponentTaskImpl implements TaskDefinition.Interface<GenerateComponentTaskInput> {
    readonly id = GENERATE_COMPONENT_TASK_ID;
    readonly title = "Component extraction — generate component";
    readonly description = "Generates a single component from its planned contract.";
    readonly maxIterations = 1;
    // Not private: each per-component generation is its own visible task in the Background Tasks viewer.
    readonly isPrivate = false;
    readonly databaseLogs = true;

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
                component: null
            } satisfies ComponentResult);
            return controller.response.done("Planned component not found; nothing to generate.");
        }

        // Resolve the theme's css variables for token-binding validation (skipped if unresolved, exactly
        // as the inline stage did — otherwise every var(--wby-*) counts as unknown and all fail).
        const slotVariables = new Map<string, string[]>();
        let validVariables = new Set<string>();
        let manifestAvailable = false;
        const manifest = await this.manifestResolver.resolve(job.themeEntryId, job.themeVersion);
        if (manifest.isOk()) {
            manifestAvailable = true;
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

        // Run inside the generate model-call scope so the child's model calls (via remote-components) are
        // attributed to the run's Generate stage — exactly as the inline stage did — keeping the token
        // panel's per-stage accounting correct now that the calls happen in per-component child tasks.
        const component = await this.modelCallScope.run(
            { runId: input.runId, stage: "generate", stageVersion: input.stageVersion },
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
                        planned,
                        validVariables,
                        manifestAvailable,
                        slotVariables,
                        log: (message, error) =>
                            log.error({ message, ...(error instanceof Error ? { error } : {}) }),
                        beat: message => log.info({ message })
                    }
                )
        );

        const written = await this.artifactStore.putJson(resultKey, {
            signature: input.signature,
            component
        } satisfies ComponentResult);
        if (written.isFail()) {
            return controller.response.error(written.error.message);
        }

        return controller.response.done(
            component ? `Generated "${planned.name}".` : `"${planned.name}" produced no output.`
        );
    }
}

export const GenerateComponentTask = TaskDefinition.createImplementation({
    implementation: GenerateComponentTaskImpl,
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
