import { createAbstraction } from "@webiny/feature/admin";
import { AuthenticationContext } from "~/features/security/AuthenticationContext/index.js";

export interface ILoginParams {
    identityType: string;
    idTokenProvider: AuthenticationContext.IdTokenProvider;
    logoutCallback?: AuthenticationContext.LogoutCallback;
}

export interface ILogInUseCase {
    execute(params: ILoginParams): Promise<void>;
}
export const LogInUseCase = createAbstraction<ILogInUseCase>("LogInUseCase");

export namespace LogInUseCase {
    export type Interface = ILogInUseCase;
    export type Params = ILoginParams;
}
