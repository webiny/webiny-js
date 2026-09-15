import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import type { NonEmptyArray } from "@webiny/api/types.js";
import type { IWorkflowInput } from "~/features/shared/abstractions.js";

export interface IWorkflowStepNotification {
    id: string;
}

export interface IWorkflowStepTeam {
    id: string;
}

export interface IWorkflowStep {
    id: string;
    title: string;
    color: string;
    description?: string;
    teams: NonEmptyArray<IWorkflowStepTeam>;
    notifications?: IWorkflowStepNotification[];
}

export interface IWorkflowValues {
    app: string;
    name: string;
    steps: NonEmptyArray<IWorkflowStep>;
}

export interface IWorkflow extends IWorkflowValues {
    id: string;
}

// Abstractions
/**
 * Provides the tenant's workflow CMS model.
 *
 * A provider rather than the model itself: fetching a model is asynchronous and tenant-dependent,
 * while DI resolution is synchronous — so an already-resolved `CmsModel` could only be supplied by a
 * per-request hook running before every consumer. Consumers `await get()` at the point of use.
 */
export interface IWorkflowModelProvider {
    get(): Promise<CmsModel>;
}

export const WorkflowModelProvider =
    createAbstraction<IWorkflowModelProvider>("WorkflowModelProvider");

export namespace WorkflowModelProvider {
    export type Interface = IWorkflowModelProvider;
}

export interface IWorkflowMapper {
    fromCmsEntry(input: CmsEntry<Omit<IWorkflow, "id">>): IWorkflow;
    toCmsEntry(input: IWorkflowInput): IWorkflow;
}

export const WorkflowMapper = createAbstraction<IWorkflowMapper>("WorkflowMapper");

export namespace WorkflowMapper {
    export type Interface = IWorkflowMapper;
}
