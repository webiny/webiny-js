import type { Container } from "@webiny/di";
import type { GraphQLSchema } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLContextualSchema } from "@webiny/handler-graphql";
import type { IGraphQLContextualSchema } from "@webiny/handler-graphql";
import { RequestContainer } from "@webiny/event-handler-core";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import {
    WORKFLOW_MODEL_ID,
    WorkflowModel as WorkflowPrivateModel
} from "./domain/workflow/workflowModel.js";
import {
    WORKFLOW_STATE_MODEL_ID,
    WorkflowStateModel as WorkflowStatePrivateModel
} from "./domain/workflowState/stateModel.js";
import { WorkflowModel } from "./domain/workflow/abstractions.js";
import { WorkflowStateModel } from "./domain/workflowState/abstractions.js";
import { WorkflowMapper } from "~/domain/workflow/WorkflowMapper.js";
import { WorkflowStateMapper } from "~/domain/workflowState/WorkflowStateMapper.js";
import { GetWorkflowFeature } from "~/features/workflow/GetWorkflow/feature.js";
import { ListWorkflowsFeature } from "~/features/workflow/ListWorkflows/feature.js";
import { CreateWorkflowFeature } from "~/features/workflow/CreateWorkflow/feature.js";
import { DeleteWorkflowFeature } from "~/features/workflow/DeleteWorkflow/feature.js";
import { UpdateWorkflowFeature } from "~/features/workflow/UpdateWorkflow/feature.js";
import { StoreWorkflowFeature } from "~/features/workflow/StoreWorkflow/feature.js";
import { GetWorkflowStateFeature } from "~/features/workflowState/GetWorkflowState/feature.js";
import { GetTargetWorkflowStateFeature } from "~/features/workflowState/GetTargetWorkflowState/feature.js";
import { ListOwnWorkflowStatesFeature } from "~/features/workflowState/ListOwnWorkflowStates/feature.js";
import { ListWorkflowStatesFeature } from "~/features/workflowState/ListWorkflowStates/feature.js";
import { ListRequestedWorkflowStatesFeature } from "~/features/workflowState/ListRequestedWorkflowStates/feature.js";
import { CreateWorkflowStateFeature } from "~/features/workflowState/CreateWorkflowState/feature.js";
import { UpdateWorkflowStateFeature } from "~/features/workflowState/UpdateWorkflowState/feature.js";
import { CancelWorkflowStateFeature } from "~/features/workflowState/CancelWorkflowState/feature.js";
import { DeleteWorkflowStateFeature } from "~/features/workflowState/DeleteWorkflowState/feature.js";
import { DeleteTargetWorkflowStateFeature } from "~/features/workflowState/DeleteTargetWorkflowState/feature.js";
import { StartWorkflowStateStepFeature } from "~/features/workflowState/StartWorkflowStateStep/feature.js";
import { ApproveWorkflowStateStepFeature } from "~/features/workflowState/ApproveWorkflowStateStep/feature.js";
import { RejectWorkflowStateStepFeature } from "~/features/workflowState/RejectWorkflowStateStep/feature.js";
import { TakeOverWorkflowStateStepFeature } from "~/features/workflowState/TakeOverWorkflowStateStep/feature.js";
import { GetUserTeamsFeature } from "~/features/internal/GetUserTeams/feature.js";
import { ListNotificationTypesFeature } from "~/features/notifications/ListNotificationTypes/index.js";
import { NotificationTransportFeature } from "./features/notifications/NotificationTransport/index.js";

// GraphQLContextualSchema is used here not to contribute schema content (the static schema is
// already registered via WorkflowsSchemaFactory) but purely for its build(ctx) timing guarantee:
// it runs after context is established but before any resolver fires, making it the right hook
// for the async CMS model fetch and lazy feature registrations that resolvers depend on.
class WorkflowsInitializerImpl implements IGraphQLContextualSchema {
    private initialized = false;

    constructor(
        private container: Container,
        private tenantCtx: TenantContext.Interface,
        private identityCtx: IdentityContext.Interface,
        private wcp: WcpContext.Interface,
        private getModel: GetModelUseCase.Interface
    ) {}

    async build(_ctx: Record<string, any>): Promise<GraphQLSchema> {
        if (!this.initialized) {
            this.initialized = true;

            if (this.tenantCtx.getTenant() && this.wcp.canUseWorkflows()) {
                await this.init();
            }
        }

        return makeExecutableSchema({
            typeDefs: "type Query\ntype Mutation",
            assumeValidSDL: true
        });
    }

    private async init(): Promise<void> {
        // Register private models
        this.container.register(WorkflowPrivateModel);
        this.container.register(WorkflowStatePrivateModel);

        // Fetch and register CMS models
        await this.identityCtx.withoutAuthorization(async () => {
            const [workflowModel, workflowStateModel] = await Promise.all([
                this.getModel.execute(WORKFLOW_MODEL_ID),
                this.getModel.execute(WORKFLOW_STATE_MODEL_ID)
            ]);

            this.container.registerInstance(WorkflowModel, workflowModel.value);
            this.container.registerInstance(WorkflowStateModel, workflowStateModel.value);
        });

        // Register mappers
        this.container.register(WorkflowMapper);
        this.container.register(WorkflowStateMapper);

        // Register notification features
        ListNotificationTypesFeature.register(this.container);
        NotificationTransportFeature.register(this.container);

        // Register workflow features
        GetWorkflowFeature.register(this.container);
        ListWorkflowsFeature.register(this.container);
        CreateWorkflowFeature.register(this.container);
        DeleteWorkflowFeature.register(this.container);
        UpdateWorkflowFeature.register(this.container);
        StoreWorkflowFeature.register(this.container);

        // Register internal features
        GetUserTeamsFeature.register(this.container);

        // Register workflow state features
        GetWorkflowStateFeature.register(this.container);
        GetTargetWorkflowStateFeature.register(this.container);
        ListOwnWorkflowStatesFeature.register(this.container);
        ListWorkflowStatesFeature.register(this.container);
        ListRequestedWorkflowStatesFeature.register(this.container);
        CreateWorkflowStateFeature.register(this.container);
        UpdateWorkflowStateFeature.register(this.container);
        CancelWorkflowStateFeature.register(this.container);
        DeleteWorkflowStateFeature.register(this.container);
        DeleteTargetWorkflowStateFeature.register(this.container);
        StartWorkflowStateStepFeature.register(this.container);
        ApproveWorkflowStateStepFeature.register(this.container);
        RejectWorkflowStateStepFeature.register(this.container);
        TakeOverWorkflowStateStepFeature.register(this.container);
    }
}

export const WorkflowsInitializer = GraphQLContextualSchema.createImplementation({
    implementation: WorkflowsInitializerImpl,
    dependencies: [RequestContainer, TenantContext, IdentityContext, WcpContext, GetModelUseCase]
});
