import { createAbstraction, type Result } from "@webiny/feature/api";
import type { TargetContextFolder } from "~/domain/review/types.js";
import type { RoutingInspection } from "~/domain/routing/types.js";
import type { RoutingDependencyError } from "~/domain/routing/errors.js";
import type { WorkflowValidationError } from "~/domain/workflow/errors.js";

export interface InspectRoutingInput {
    /** The step config as the editor holds it, unsaved; validated here. */
    stepConfig: unknown;
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    requesterId: string;
    /** The target folder with its app type (`cms:<modelId>`, `wb:page`); `null` for the root. */
    folder: TargetContextFolder | null;
    now: Date;
}

export interface IInspectRoutingUseCaseErrors {
    validation: WorkflowValidationError;
    routing: RoutingDependencyError;
}

type UseCaseError = IInspectRoutingUseCaseErrors[keyof IInspectRoutingUseCaseErrors];

export interface IInspectRoutingUseCase {
    execute(input: InspectRoutingInput): Promise<Result<RoutingInspection, UseCaseError>>;
}

/**
 * The rule inspector (spec 6, D45, D95, D118, R121): what routing would do with an unsaved step
 * config for a requester and folder, with the per-rule trace. Internal (D132): the app wrappers
 * check `editor`. Read access is evaluated at folder level (A47).
 */
export const InspectRoutingUseCase =
    createAbstraction<IInspectRoutingUseCase>("InspectRoutingUseCase");

export namespace InspectRoutingUseCase {
    export type Interface = IInspectRoutingUseCase;
    export type Input = InspectRoutingInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<RoutingInspection, UseCaseError>>;
}
