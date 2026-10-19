import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { AdminExtensionModelNotFoundError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionModelUpdateError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionNotFoundError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionPersistenceError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtensionValidationError } from "~/api/adminExtensions/domain/errors.js";

export interface ISetModelFieldRendererInput {
    /** The content model, e.g. `article`. */
    modelId: string;
    /** A top-level field of that model, e.g. `title`. */
    fieldId: string;
    /** The field renderer extension's name, e.g. `char-count`. */
    rendererName: string;
}

export interface ISetModelFieldRendererOutput {
    modelId: string;
    fieldId: string;
    /** The renderer name now stored on the field. */
    cmsRendererName: string;
}

type IError =
    | AdminExtensionModelNotFoundError
    | AdminExtensionNotFoundError
    | AdminExtensionPersistenceError
    | AdminExtensionValidationError
    | AdminExtensionModelUpdateError;

export interface ISetModelFieldRendererUseCase {
    execute(
        input: ISetModelFieldRendererInput
    ): Promise<Result<ISetModelFieldRendererOutput, IError>>;
}

/**
 * Applies an enabled field renderer extension to one field of a content model.
 *
 * Separate from creating the renderer, so accepting a renderer never also changes a model. The model
 * is saved through the CMS's own update, which checks the caller's model permissions and refuses
 * models defined in code.
 */
export const SetModelFieldRendererUseCase = createAbstraction<ISetModelFieldRendererUseCase>(
    "RemoteComponents/SetModelFieldRendererUseCase"
);

export namespace SetModelFieldRendererUseCase {
    export type Interface = ISetModelFieldRendererUseCase;
    export type Input = ISetModelFieldRendererInput;
    export type Output = ISetModelFieldRendererOutput;
    export type Error = IError;
}
