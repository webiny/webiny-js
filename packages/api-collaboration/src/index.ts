import { ContextPlugin, createRegisterExtensionPlugin } from "@webiny/handler";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { COLLAB_THREAD_MODEL_ID } from "./constants.js";
import { CollabThreadModel as CollabThreadPrivateModel } from "./domain/thread/threadModel.js";
import { CollabThreadModel } from "./domain/thread/abstractions.js";
import { CollabThreadMapper } from "./domain/thread/CollabThreadMapper.js";
import { ResolveLocatorFeature } from "./features/locator/ResolveLocator/feature.js";
import { CmsLocatorResolverFeature } from "./features/cms/CmsLocatorResolver/feature.js";
import { GetThreadFeature } from "./features/thread/GetThread/feature.js";
import { UpdateThreadFeature } from "./features/thread/UpdateThread/feature.js";
import { CreateThreadFeature } from "./features/thread/CreateThread/feature.js";
import { ListThreadsFeature } from "./features/thread/ListThreads/feature.js";
import { ReplyToThreadFeature } from "./features/thread/ReplyToThread/feature.js";
import { ThreadResolutionFeature } from "./features/thread/ThreadResolution/feature.js";
import { MessageOperationsFeature } from "./features/thread/MessageOperations/feature.js";
import { DeleteThreadFeature } from "./features/thread/DeleteThread/feature.js";
import { CollaborationSchema } from "./graphql/collaboration.js";

export const createCollaboration = () => {
    const modelsPlugin = createRegisterExtensionPlugin(context => {
        context.container.register(CollabThreadPrivateModel);
    });

    const collaborationContextPlugin = new ContextPlugin(async context => {
        const tenantContext = context.container.resolve(TenantContext);
        const identityContext = context.container.resolve(IdentityContext);

        // TODO(before release): collaboration ships in the APW tier — re-gate on the
        // appropriate WCP capability (e.g. wcpContext.canUseWorkflows()). Ungated for now so it
        // works without a workflows license during development.
        if (!tenantContext.getTenant()) {
            return;
        }

        // Register private model, then resolve it to a CmsModel instance.
        context.container.register(CollabThreadPrivateModel);

        const getModel = context.container.resolve(GetModelUseCase);

        await identityContext.withoutAuthorization(async () => {
            const threadModel = await getModel.execute(COLLAB_THREAD_MODEL_ID);
            context.container.registerInstance(CollabThreadModel, threadModel.value);
        });

        // Register the mapper.
        context.container.register(CollabThreadMapper);

        // Register features.
        ResolveLocatorFeature.register(context.container);
        // Built-in CMS locator resolver (contentType "cms.entry").
        CmsLocatorResolverFeature.register(context.container);
        UpdateThreadFeature.register(context.container);
        GetThreadFeature.register(context.container);
        CreateThreadFeature.register(context.container);
        ListThreadsFeature.register(context.container);
        ReplyToThreadFeature.register(context.container);
        ThreadResolutionFeature.register(context.container);
        MessageOperationsFeature.register(context.container);
        DeleteThreadFeature.register(context.container);

        // Register the GraphQL schema.
        context.container.register(CollaborationSchema);
    });

    collaborationContextPlugin.name = "collaboration.context";

    return [collaborationContextPlugin, modelsPlugin];
};
