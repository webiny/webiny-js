import {
    useContextHandler,
    type UseContextHandlerParams,
    useGraphQLHandler,
    type UseGraphQLHandlerParams
} from "@webiny/testing";
import { Context } from "~/types.js";
import { createWorkflows } from "~/index.js";
import { PluginsContainer } from "@webiny/plugins";
import { STATE_MODEL_ID, WORKFLOW_MODEL_ID } from "~/constants.js";
import {
    type ICreateWorkflowStateResponse,
    type ICreateWorkflowStateVariables,
    type IDeleteWorkflowResponse,
    type IDeleteWorkflowVariables,
    type IGetWorkflowResponse,
    type IGetTargetWorkflowStateVariables,
    type IGetWorkflowVariables,
    type IListWorkflowResponse,
    type IListWorkflowVariables,
    type IStoreWorkflowResponse,
    type IStoreWorkflowVariables,
    type IGetTargetWorkflowStateResponse,
    GET_TARGET_WORKFLOW_STATE_QUERY
} from "./graphql.js";
import {
    CREATE_WORKFLOW_STATE_MUTATION,
    DELETE_WORKFLOW_MUTATION,
    GET_WORKFLOW_QUERY,
    LIST_WORKFLOWS_QUERY,
    STORE_WORKFLOW_MUTATION
} from "./graphql.js";

export const createContextHandler = async (params: UseContextHandlerParams = {}) => {
    const plugins = new PluginsContainer(params.plugins || []);
    plugins.register(createWorkflows());
    const handler = useContextHandler<Context>({
        ...params,
        permissions: [
            {
                name: "*"
            }
        ],
        debug: params.debug === undefined ? true : params.debug,
        plugins: plugins.all()
    });
    const context = await handler.context();
    const workflowModel = await context.cms.getModel(WORKFLOW_MODEL_ID);
    const stateModel = await context.cms.getModel(STATE_MODEL_ID);
    return {
        handler,
        context,
        workflowModel,
        stateModel
    };
};

export const createGraphQLHandler = (params: UseGraphQLHandlerParams = {}) => {
    const plugins = new PluginsContainer(params.plugins || []);
    plugins.register(createWorkflows());
    const handler = useGraphQLHandler({
        ...params,
        permissions: [
            {
                name: "*"
            }
        ],
        debug: params.debug === undefined ? true : params.debug,
        plugins: plugins.all()
    });
    return {
        handler,
        /**
         * Workflows
         */
        storeWorkflow: handler.createMutation<IStoreWorkflowVariables, IStoreWorkflowResponse>(
            STORE_WORKFLOW_MUTATION
        ),
        deleteWorkflow: handler.createMutation<IDeleteWorkflowVariables, IDeleteWorkflowResponse>(
            DELETE_WORKFLOW_MUTATION
        ),
        getWorkflow: handler.createQuery<IGetWorkflowVariables, IGetWorkflowResponse>(
            GET_WORKFLOW_QUERY
        ),
        listWorkflows: handler.createQuery<IListWorkflowVariables, IListWorkflowResponse>(
            LIST_WORKFLOWS_QUERY
        ),
        /**
         * Workflow states
         */
        createWorkflowState: handler.createMutation<
            ICreateWorkflowStateVariables,
            ICreateWorkflowStateResponse
        >(CREATE_WORKFLOW_STATE_MUTATION),
        getTargetWorkflowState: handler.createMutation<
            IGetTargetWorkflowStateVariables,
            IGetTargetWorkflowStateResponse
        >(GET_TARGET_WORKFLOW_STATE_QUERY)
    };
};
