import { type Container, createFeature } from "@webiny/feature/api";
import {
    CorrectionModelPlugin,
    JobModelPlugin,
    ModelCallModelPlugin,
    OverrideModelPlugin,
    RunModelPlugin
} from "~/domain/models.js";
import { JobModelProvider } from "~/features/modelProviders/JobModelProvider.js";
import { RunModelProvider } from "~/features/modelProviders/RunModelProvider.js";
import { OverrideModelProvider } from "~/features/modelProviders/OverrideModelProvider.js";
import { ModelCallModelProvider } from "~/features/modelProviders/ModelCallModelProvider.js";
import { CorrectionModelProvider } from "~/features/modelProviders/CorrectionModelProvider.js";
import {
    CorrectionRepository,
    JobRepository,
    ModelCallRepository,
    OverrideRepository,
    RunRepository
} from "~/features/repositories.js";
import { ModelCallScopeService } from "~/features/shared/modelCallScope.js";
import {
    ModelCallErrorRecorder,
    ModelCallSuccessRecorder
} from "~/features/shared/modelCallRecorder.js";
import { RunLock } from "~/storage/RunLock.js";
import { ComponentExtractionPermissionsFeature } from "~/features/permissions.js";
import { KeyValueStageArtifactStore } from "~/storage/StageArtifactStore.js";
import { S3BlobStore } from "~/storage/S3BlobStore.js";
import { OverrideApplicatorService } from "~/features/shared/OverrideApplicator.js";
import { StageTaskRunnerService } from "~/features/stages/StageTaskRunner.js";
import { STAGE_TASKS } from "~/features/stages/stageTasks.js";
import { DiscoverHandler } from "~/features/stages/discover/DiscoverHandler.js";
import { CaptureHandler } from "~/features/stages/capture/CaptureHandler.js";
import { SegmentHandler } from "~/features/stages/segment/SegmentHandler.js";
import { ClusterHandler } from "~/features/stages/cluster/ClusterHandler.js";
import { ClassifyHandler } from "~/features/stages/classify/ClassifyHandler.js";
import { PlanHandler } from "~/features/stages/plan/PlanHandler.js";
import { GenerateHandler } from "~/features/stages/generate/GenerateHandler.js";
import { AssembleHandler } from "~/features/stages/assemble/AssembleHandler.js";
import { PromoteHandler } from "~/features/stages/promote/PromoteHandler.js";
import { ThemeManifestResolverService } from "~/features/shared/themeManifest.js";
import { ThemeCssResolverService } from "~/features/shared/themeCss.js";
import { PreviewDomainResolverService } from "~/features/shared/previewDomain.js";
import { ComponentRenderServiceImplementation } from "~/features/shared/ComponentRenderService.js";
import { RenderComponentsTask } from "~/features/render/RenderComponentsTask.js";
import { RegenerateComponentTask } from "~/features/render/RegenerateComponentTask.js";
import { RegeneratePlanTask } from "~/features/stages/plan/RegeneratePlanTask.js";
import { GenerateComponentTask } from "~/features/stages/generate/GenerateComponentTask.js";
import { ComponentExtractionAiService } from "~/features/shared/ai.js";
import { ComponentExtractionCapabilityImplementation } from "~/features/shared/capability.js";
import { ChromiumBrowserProvider } from "@webiny/site-capture/browser/ChromiumBrowserProvider.js";
import { RunImageRouteDefinition } from "~/rest/RunImageRoute.js";
import { registerComponentExtractionGraphQL } from "~/graphql/createGraphQL.js";

/**
 * Component Extraction — the backend entities (phase 1, W2).
 *
 * The five private CMS models, their repositories, and the per-job run lock. The stage tasks (W3) and
 * the nine stages (W4) register on top of this. Each model is reached through a provider that fetches
 * it on demand, so repositories await one where they need it — the same pattern the Theme app uses.
 */
export const ComponentExtractionFeature = createFeature({
    name: "ComponentExtraction",
    register(container: Container) {
        // The CMS model factories, so ModelsProvider can build the CmsModels.
        container.register(JobModelPlugin);
        container.register(RunModelPlugin);
        container.register(OverrideModelPlugin);
        container.register(ModelCallModelPlugin);
        container.register(CorrectionModelPlugin);

        // On-demand resolution of those five models. Repositories inject a provider and await it, so
        // nothing depends on a per-request hook having deposited the model first.
        container.register(JobModelProvider);
        container.register(RunModelProvider);
        container.register(OverrideModelProvider);
        container.register(ModelCallModelProvider);
        container.register(CorrectionModelProvider);

        ComponentExtractionPermissionsFeature.register(container);

        container.register(JobRepository);
        container.register(RunRepository);
        container.register(OverrideRepository);
        container.register(ModelCallRepository);
        container.register(CorrectionRepository);
        container.register(RunLock);

        // Model-call accounting (W7.1): the stage scope the runner sets, and the recorder that captures
        // every model call the core `Ai` makes during a stage — covering Classify, Plan and Generate.
        container.register(ModelCallScopeService);
        container.register(ModelCallSuccessRecorder);
        container.register(ModelCallErrorRecorder);
        container.register(KeyValueStageArtifactStore);
        container.register(S3BlobStore);
        // Override application (W8.1): turns a stage's machine output into its effective output.
        container.register(OverrideApplicatorService);
        // The headless browser used by Capture. Stateless — safe to register alongside theme extraction's.
        container.register(ChromiumBrowserProvider);

        // Stage topology: the shared runner and one thin task per stage.
        container.register(StageTaskRunnerService);
        STAGE_TASKS.forEach(task => container.register(task));

        // Rendered-component screenshots (W7.7): the resolvers and service the render task composes, and
        // the on-demand task that screenshots a run's generated components for the Generate view.
        container.register(ThemeCssResolverService);
        container.register(PreviewDomainResolverService);
        container.register(ComponentRenderServiceImplementation);
        container.register(RenderComponentsTask);
        container.register(RegenerateComponentTask);
        // Single-component Plan regeneration (W8): a fresh contract proposal for one component.
        container.register(RegeneratePlanTask);
        // Generate fan-out (W-fanout): one child task per component, coordinated by the Generate stage.
        container.register(GenerateComponentTask);

        // Shared services for the model-backed stages: manifest resolution (Cluster, Plan) and the AI
        // provider selection (Classify, Plan, Generate).
        container.register(ThemeManifestResolverService);
        container.register(ComponentExtractionAiService);
        // The Settings → AI Power-Ups row for Classify and Plan, so their model is configurable.
        container.register(ComponentExtractionCapabilityImplementation);

        // Stage handlers (W4). Registered as they land — a stage with no handler fails cleanly.
        container.register(DiscoverHandler);
        container.register(CaptureHandler);
        container.register(SegmentHandler);
        container.register(ClusterHandler);
        container.register(ClassifyHandler);
        container.register(PlanHandler);
        container.register(GenerateHandler);
        container.register(AssembleHandler);
        container.register(PromoteHandler);

        registerComponentExtractionGraphQL(container);

        // The auth-gated run-image delivery route (W7.2), serving derived images for the visibility screens.
        container.register(RunImageRouteDefinition);
    }
});
