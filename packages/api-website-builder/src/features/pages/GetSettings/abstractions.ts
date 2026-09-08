import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { PageNotAuthorizedError } from "~/domain/page/errors.js";

export interface IGetSettingsUseCase {
    execute(): Promise<Result<{ domain: string }, PageNotAuthorizedError>>;
}

export const GetSettingsUseCase = createAbstraction<IGetSettingsUseCase>("Wb/GetSettingsUseCase");

export namespace GetSettingsUseCase {
    export type Interface = IGetSettingsUseCase;
    export type Return = Promise<Result<{ domain: string }, PageNotAuthorizedError>>;
}
