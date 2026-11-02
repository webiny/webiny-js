import { createAbstraction, type Result } from "@webiny/feature/api";
import type { RoutingInspection } from "@webiny/api-workflows/domain/routing/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type {
    WorkflowPersistenceError,
    WorkflowValidationError
} from "@webiny/api-workflows/domain/workflow/errors.js";
import type { InspectRoutingUseCase } from "@webiny/api-workflows/features/routing/InspectRouting/index.js";

export interface InspectCmsEntryRoutingInput {
    /** The step config as the editor holds it, unsaved; the engine validates it. */
    stepConfig: unknown;
    /** Namespace id, `cms.<modelId>`. */
    model: string;
    requesterId: string;
    /** An entry folder of the model; missing, `null` or "root" is the root. */
    folderId?: string | null;
}

export interface IInspectCmsEntryRoutingUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    validation: WorkflowValidationError;
    persistence: WorkflowPersistenceError;
    inspect: InspectRoutingUseCase.Error;
}

type UseCaseError =
    IInspectCmsEntryRoutingUseCaseErrors[keyof IInspectCmsEntryRoutingUseCaseErrors];

export interface IInspectCmsEntryRoutingUseCase {
    execute(input: InspectCmsEntryRoutingInput): Promise<Result<RoutingInspection, UseCaseError>>;
}

/**
 * The workflow editor's rule inspector for CMS entries (spec 6, D45, D95, D118, R121): `editor`
 * only (R125); read access at folder level (A47).
 */
export const InspectCmsEntryRoutingUseCase = createAbstraction<IInspectCmsEntryRoutingUseCase>(
    "InspectCmsEntryRoutingUseCase"
);

export namespace InspectCmsEntryRoutingUseCase {
    export type Interface = IInspectCmsEntryRoutingUseCase;
    export type Input = InspectCmsEntryRoutingInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<RoutingInspection, UseCaseError>>;
}
