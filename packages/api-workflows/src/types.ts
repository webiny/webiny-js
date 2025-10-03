import type { NonEmptyArray } from "@webiny/api/types.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WcpContext } from "@webiny/api-wcp/types.js";
import type { Context as TasksContext } from "@webiny/tasks/types.js";

export interface IWorkflowStepNotification {
    id: string;
}

export interface IWorkflowStepTeam {
    id: string;
}

export interface WorkflowStep {
    id: string;
    title: string;
    color: string;
    description?: string;
    teams: NonEmptyArray<IWorkflowStepTeam>;
    notifications?: IWorkflowStepNotification[];
}

export interface IWorkflow {
    id: string;
    app: string;
    name: string;
    steps: NonEmptyArray<WorkflowStep>;
}

export interface IWorkflowStepTeamInput {
    id: string;
}

export interface IWorkflowStepNotificationInput {
    id: string;
}

export interface IWorkflowStepInput {
    id: string;
    title: string;
    color: string;
    description?: string;
    teams: NonEmptyArray<IWorkflowStepTeamInput>;
    notifications?: IWorkflowStepNotificationInput[];
}

export interface IWorkflowInput {
    id: string;
    app: string;
    name: string;
    steps: NonEmptyArray<IWorkflowStepInput>;
}

export interface ICreateWorkflowInput {
    id: string;
    name: string;
    steps: NonEmptyArray<IWorkflowStepInput>;
}

export interface IUpdateWorkflowInput {
    name: string;
    steps: NonEmptyArray<IWorkflowStepInput>;
}

export interface IWorkflowsContextGetParams {
    app: string;
    id: string;
}
export interface IWorkflowsContextListParams {
    app?: string;
}

export interface IWorkflowsContext {
    ensureAccess(): Promise<void>;

    createWorkflow(app: string, input: IWorkflowInput): Promise<IWorkflow>;
    updateWorkflow(app: string, id: string, input: IWorkflowInput): Promise<IWorkflow>;
    deleteWorkflow(app: string, id: string): Promise<boolean>;

    getWorkflow(params: IWorkflowsContextGetParams): Promise<IWorkflow | null>;
    listWorkflows(params?: IWorkflowsContextListParams): Promise<IWorkflow[]>;
}

export interface Context
    extends ContextInterface,
        Pick<CmsContext, "security" | "cms" | "plugins">,
        Pick<WcpContext, "wcp"> {
    workflows: IWorkflowsContext;
}
