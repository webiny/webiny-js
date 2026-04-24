import { useFeature } from "@webiny/app";
import { LogInFeature } from "~/features/security/LogIn/feature.js";
import { LogOutFeature } from "~/features/security/LogOut/index.js";
import type { ILoginParams } from "~/features/security/LogIn/abstractions.js";
import { useIdentity } from "./useIdentity.js";
import type { Identity } from "~/domain/Identity.js";

export interface IUseAuthenticationReturn {
    identity: Identity;
    isAuthenticated: boolean;
    login: (params: ILoginParams) => Promise<void>;
    logout: () => Promise<void>;
}

export function useAuthentication(): IUseAuthenticationReturn {
    const { useCase: logInUseCase } = useFeature(LogInFeature);
    const { useCase: logOutUseCase } = useFeature(LogOutFeature);
    const { identity, isAuthenticated } = useIdentity();

    return {
        login: logInUseCase.execute.bind(logInUseCase),
        logout: logOutUseCase.execute.bind(logOutUseCase),
        identity,
        isAuthenticated
    };
}
