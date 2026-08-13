import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { BrowserProvider } from "@webiny/site-capture";
import { RENDER_COMPONENTS_TASK_ID, stageArtifactKey } from "~/constants.js";
import { RunRepository, JobRepository } from "~/domain/abstractions.js";
import { StageArtifactStore } from "~/domain/stage.js";
import { stageEntry } from "~/domain/ledger.js";
import type {
    GenerateArtifact,
    PlanArtifact,
    RenderArtifact,
    RenderRecord
} from "~/domain/artifacts.js";
import { ComponentRenderService } from "~/features/shared/ComponentRenderService.js";
import { ThemeCssResolver } from "~/features/shared/themeCss.js";
import { PreviewDomainResolver } from "~/features/shared/previewDomain.js";

export interface RenderTaskInput {
    runId: string;
}

export interface RenderTaskProgress {
    current: number;
    total: number;
    message: string;
}

export interface RenderTaskOutput {
    progress?: RenderTaskProgress;
}

/** Resumable checkpoint: which components are rendered, and the results so far. */
interface RenderCheckpoint {
    nextIndex: number;
    renders: RenderRecord[];
}

// One component's render can take up to ~45s; the margin must exceed that, since the timeout is only
// checked between components — start one with less runway than it needs and the Lambda is hard-killed
// mid-render.
const RENDER_SAFETY_MARGIN_SECONDS = 120;

type RunParams = TaskDefinition.RunParams<RenderTaskInput, RenderTaskOutput>;
type RunResult = Promise<TaskDefinition.Result<RenderTaskInput, RenderTaskOutput>>;

/**
 * Renders a run's generated components to screenshots (W7.7). Not a pipeline stage — triggered on
 * demand once Generate is done. Reads the Generate artifact, and for each generated component bundles +
 * renders + screenshots it via the shared browser and the website sandbox route, writing the results to
 * a Render artifact keyed to the Generate stage version. Resumable: it checkpoints after each component
 * and continues in a fresh invocation near the Lambda timeout, like Capture and Generate.
 */
class RenderComponentsTaskImpl implements TaskDefinition.Interface<
    RenderTaskInput,
    RenderTaskOutput
> {
    readonly id = RENDER_COMPONENTS_TASK_ID;
    readonly title = "Component extraction — render components";
    readonly description = "Screenshots a run's generated components for the Generate view.";
    readonly maxIterations = 30;
    readonly isPrivate = false;
    readonly databaseLogs = true;

    constructor(
        readonly runRepository: RunRepository.Interface,
        readonly jobRepository: JobRepository.Interface,
        readonly artifactStore: StageArtifactStore.Interface,
        readonly browserProvider: BrowserProvider.Interface,
        readonly renderService: ComponentRenderService.Interface,
        readonly themeCss: ThemeCssResolver.Interface,
        readonly previewDomain: PreviewDomainResolver.Interface
    ) {}

    async run({ input, controller }: RunParams): RunResult {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }
        const log = controller.logger;

        const runResult = await this.runRepository.get(input.runId);
        if (runResult.isFail()) {
            return controller.response.error(runResult.error.message);
        }
        const run = runResult.value;

        const jobResult = await this.jobRepository.get(run.jobId);
        if (jobResult.isFail()) {
            return controller.response.error(jobResult.error.message);
        }
        const job = jobResult.value;

        const generate = stageEntry(run.stages, "generate");
        const componentsKey = generate?.artifacts.components;
        if (
            !generate ||
            (generate.status !== "done" && generate.status !== "stale") ||
            !componentsKey
        ) {
            return controller.response.error("Generate has not produced components to render.");
        }
        const generateVersion = generate.stageVersion;

        const generateArtifact = await this.artifactStore.getJson<GenerateArtifact>(componentsKey);
        if (generateArtifact.isFail() || !generateArtifact.value) {
            return controller.response.error("The generate artifact could not be read.");
        }
        const components = generateArtifact.value.components;
        const total = components.length;

        // The source section crop per component, for the visual-similarity indicator — read from the
        // Plan artifact (which carries each component's representative crop). Best-effort: a missing plan
        // just leaves the indicators null.
        const cropBySignature = new Map<string, string>();
        const planKey = stageEntry(run.stages, "plan")?.artifacts.plan;
        if (planKey) {
            const plan = await this.artifactStore.getJson<PlanArtifact>(planKey);
            if (plan.isOk() && plan.value) {
                for (const planned of plan.value.components) {
                    cropBySignature.set(planned.signature, planned.representativeCrop.cropRef);
                }
            }
        }

        const rendersKey = stageArtifactKey(run.id, "generate", generateVersion, "renders");
        if (total === 0) {
            const empty: RenderArtifact = { renders: [] };
            await this.artifactStore.putJson(rendersKey, empty);
            return controller.response.done({});
        }

        // Resolve the render host and the pinned theme's CSS once — both are constant across the run.
        const previewDomain = await this.previewDomain.resolve();
        if (previewDomain.isFail()) {
            return controller.response.error(previewDomain.error.message);
        }
        const themeCssResult = await this.themeCss.resolve(job.themeEntryId, job.themeVersion);
        // Best-effort: without the pinned theme's CSS the component still renders on its var() fallbacks
        // (and the sandbox's own active-theme layer); the comparison is just less faithful.
        const themeCss = themeCssResult.isOk() ? themeCssResult.value : "";
        if (themeCssResult.isFail()) {
            await log.info({
                message: `Rendering without the pinned theme's CSS: ${themeCssResult.error.message}`
            });
        }

        const checkpointKey = stageArtifactKey(
            run.id,
            "generate",
            generateVersion,
            "render-checkpoint"
        );
        const loaded = await this.artifactStore.getJson<RenderCheckpoint>(checkpointKey);
        if (loaded.isFail()) {
            return controller.response.error(loaded.error.message);
        }
        const checkpoint: RenderCheckpoint = loaded.value ?? { nextIndex: 0, renders: [] };

        const session = await this.browserProvider.open();
        try {
            while (checkpoint.nextIndex < total) {
                const component = components[checkpoint.nextIndex];
                const result = await this.renderService.render({
                    session,
                    runId: run.id,
                    stageVersion: generateVersion,
                    previewDomain: previewDomain.value,
                    themeCss,
                    component: {
                        signature: component.signature,
                        name: component.name,
                        source: component.source,
                        css: component.css
                    },
                    sourceCropRef: cropBySignature.get(component.signature)
                });

                if (result.isOk()) {
                    checkpoint.renders.push({
                        signature: component.signature,
                        renderRef: result.value.renderRef,
                        width: result.value.width,
                        height: result.value.height,
                        ok: true,
                        similarity: result.value.similarity
                    });
                } else {
                    // One component failing to render must not lose the rest — record and continue.
                    checkpoint.renders.push({
                        signature: component.signature,
                        renderRef: "",
                        width: 0,
                        height: 0,
                        ok: false,
                        similarity: null
                    });
                    await log.error({
                        message: `Could not render "${component.name}": ${result.error.message}`
                    });
                }

                checkpoint.nextIndex++;
                const saved = await this.artifactStore.putJson(checkpointKey, checkpoint);
                if (saved.isFail()) {
                    return controller.response.error(saved.error.message);
                }
                await controller.state.updateOutput({
                    progress: {
                        current: checkpoint.nextIndex,
                        total,
                        message: `Rendered ${checkpoint.nextIndex}/${total} components.`
                    }
                });

                if (
                    checkpoint.nextIndex < total &&
                    controller.runtime.isCloseToTimeout(RENDER_SAFETY_MARGIN_SECONDS)
                ) {
                    return controller.response.continue(input, { seconds: 1 });
                }
            }
        } finally {
            await session.close();
        }

        const artifact: RenderArtifact = { renders: checkpoint.renders };
        const written = await this.artifactStore.putJson(rendersKey, artifact);
        if (written.isFail()) {
            return controller.response.error(written.error.message);
        }

        const ok = checkpoint.renders.filter(record => record.ok).length;
        await log.info({
            message: `Rendered ${ok}/${total} component(s).`
        });
        return controller.response.done({});
    }
}

export const RenderComponentsTask = TaskDefinition.createImplementation({
    implementation: RenderComponentsTaskImpl,
    dependencies: [
        RunRepository,
        JobRepository,
        StageArtifactStore,
        BrowserProvider,
        ComponentRenderService,
        ThemeCssResolver,
        PreviewDomainResolver
    ]
});
