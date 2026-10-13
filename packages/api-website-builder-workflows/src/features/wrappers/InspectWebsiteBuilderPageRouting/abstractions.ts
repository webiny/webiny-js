import { createAbstraction, type Result } from "@webiny/feature/api";
import type { RoutingInspection } from "@webiny/api-workflows/domain/routing/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import type { InspectRoutingUseCase } from "@webiny/api-workflows/features/routing/InspectRouting/index.js";

export interface InspectWebsiteBuilderPageRoutingInput {
    /** The step config as the editor holds it, unsaved; the engine validates it. */
    stepConfig: unknown;
    requesterId: string;
    /** A page folder; missing, `null` or "root" is the root. */
    folderId?: string | null;
}

export interface IInspectWebsiteBuilderPageRoutingUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
    inspect: InspectRoutingUseCase.Error;
}

type UseCaseError =
    IInspectWebsiteBuilderPageRoutingUseCaseErrors[keyof IInspectWebsiteBuilderPageRoutingUseCaseErrors];

export interface IInspectWebsiteBuilderPageRoutingUseCase {
    execute(
        input: InspectWebsiteBuilderPageRoutingInput
    ): Promise<Result<RoutingInspection, UseCaseError>>;
}

/**
 * The workflow editor's rule inspector for pages (spec 6, D45, D95, D118, R121): `editor` only
 * (R125); read access at folder level (A47).
 */
export const InspectWebsiteBuilderPageRoutingUseCase =
    createAbstraction<IInspectWebsiteBuilderPageRoutingUseCase>(
        "InspectWebsiteBuilderPageRoutingUseCase"
    );

export namespace InspectWebsiteBuilderPageRoutingUseCase {
    export type Interface = IInspectWebsiteBuilderPageRoutingUseCase;
    export type Input = InspectWebsiteBuilderPageRoutingInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<RoutingInspection, UseCaseError>>;
}
