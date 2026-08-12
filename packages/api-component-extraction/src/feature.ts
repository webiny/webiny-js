import { type Container, createFeature } from "@webiny/feature/api";
import { RequestContextInitializer } from "@webiny/event-handler-core";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { JOB_MODEL_ID, OVERRIDE_MODEL_ID, RUN_MODEL_ID } from "~/constants.js";
import { JobModelPlugin, OverrideModelPlugin, RunModelPlugin } from "~/domain/models.js";
import { JobModel, OverrideModel, RunModel } from "~/domain/abstractions.js";
import { JobRepository, OverrideRepository, RunRepository } from "~/features/repositories.js";
import { RunLock } from "~/storage/RunLock.js";
import { ComponentExtractionPermissionsFeature } from "~/features/permissions.js";
import { KeyValueStageArtifactStore } from "~/storage/StageArtifactStore.js";
import { S3BlobStore } from "~/storage/S3BlobStore.js";
import { StageTaskRunnerService } from "~/features/stages/StageTaskRunner.js";
import { STAGE_TASKS } from "~/features/stages/stageTasks.js";
import { DiscoverHandler } from "~/features/stages/discover/DiscoverHandler.js";
import { CaptureHandler } from "~/features/stages/capture/CaptureHandler.js";
import { SegmentHandler } from "~/features/stages/segment/SegmentHandler.js";
import { ClusterHandler } from "~/features/stages/cluster/ClusterHandler.js";
import { ThemeManifestResolverService } from "~/features/shared/themeManifest.js";
import { ChromiumBrowserProvider } from "@webiny/site-capture/browser/ChromiumBrowserProvider.js";
import { registerComponentExtractionGraphQL } from "~/graphql/createGraphQL.js";

/**
 * Component Extraction — the backend entities (phase 1, W2).
 *
 * The three private CMS models, their repositories, and the per-job run lock. The stage tasks (W3) and
 * the nine stages (W4) register on top of this. Per-request the three `CmsModel`s are resolved and
 * registered so repositories inject them as plain dependencies — the same pattern the Theme app uses.
 */
export const ComponentExtractionFeature = createFeature({
    name: "ComponentExtraction",
    register(container: Container) {
        // The CMS model factories, so ModelsProvider can build the CmsModels.
        container.register(JobModelPlugin);
        container.register(RunModelPlugin);
        container.register(OverrideModelPlugin);

        ComponentExtractionPermissionsFeature.register(container);

        container.register(JobRepository);
        container.register(RunRepository);
        container.register(OverrideRepository);
        container.register(RunLock);
        container.register(KeyValueStageArtifactStore);
        container.register(S3BlobStore);
        // The headless browser used by Capture. Stateless — safe to register alongside theme extraction's.
        container.register(ChromiumBrowserProvider);

        // Stage topology: the shared runner and one thin task per stage.
        container.register(StageTaskRunnerService);
        STAGE_TASKS.forEach(task => container.register(task));

        // Resolves the pinned theme's manifest, shared by Cluster (token binding) and Plan.
        container.register(ThemeManifestResolverService);

        // Stage handlers (W4). Registered as they land — a stage with no handler fails cleanly.
        container.register(DiscoverHandler);
        container.register(CaptureHandler);
        container.register(SegmentHandler);
        container.register(ClusterHandler);

        registerComponentExtractionGraphQL(container);

        // Per-request resolution of the three CmsModels. Runs without authorization because reading a
        // model definition is not the same act as reading an entry — entry-level authorization still
        // applies in the use cases.
        container.registerInstance(RequestContextInitializer, {
            async init(ctx: Record<string, any>) {
                const requestContainer = ctx.container as Container;
                const identityContext = requestContainer.resolve(IdentityContext);
                const getModel = requestContainer.resolve(GetModelUseCase);

                await identityContext.withoutAuthorization(async () => {
                    const job = await getModel.execute(JOB_MODEL_ID);
                    requestContainer.registerInstance(JobModel, job.value);

                    const run = await getModel.execute(RUN_MODEL_ID);
                    requestContainer.registerInstance(RunModel, run.value);

                    const override = await getModel.execute(OVERRIDE_MODEL_ID);
                    requestContainer.registerInstance(OverrideModel, override.value);
                });
            }
        });
    }
});
