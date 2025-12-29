import { useFeature } from "@webiny/app";
import { LogInFeature } from "~/features/security/LogIn/feature.js";
import { LogOutFeature } from "~/features/security/LogOut/index.js";
import type { ILoginParams } from "~/features/security/LogIn/abstractions.js";

export interface IUseAuthenticationReturn {
    login: (params: ILoginParams) => Promise<void>;
    logout: () => Promise<void>;
}

export function useAuthentication(): IUseAuthenticationReturn {
    const { useCase: logInUseCase } = useFeature(LogInFeature);
    const { useCase: logOutUseCase } = useFeature(LogOutFeature);

    return {
        login: logInUseCase.execute.bind(logInUseCase),
        logout: logOutUseCase.execute.bind(logOutUseCase)
    };
}
