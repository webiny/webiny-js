import { createAbstraction } from "@webiny/feature/api";
import type { Identity } from "~/features/security/IdentityContext/Identity.js";

export interface IAuthenticationContext {
    authenticate(token: string): Promise<Identity>;
    getAuthToken(): string | undefined;
}

export const AuthenticationContext = createAbstraction<IAuthenticationContext>(
    "AuthenticationContext"
);

export namespace AuthenticationContext {
    export type Interface = IAuthenticationContext;
}
