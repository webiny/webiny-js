import { createAbstraction } from "@webiny/feature/api";
import type { IdentityData } from "~/features/security/IdentityContext/Identity.js";

export interface IAuthenticator {
    authenticate(token: string): Promise<IdentityData | null>;
}

export const Authenticator = createAbstraction<IAuthenticator>("Authenticator");

export namespace Authenticator {
    export type Interface = IAuthenticator;
}
