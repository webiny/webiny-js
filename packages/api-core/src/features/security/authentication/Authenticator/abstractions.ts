import { createAbstraction } from "@webiny/feature/api";
import type { IdentityData } from "~/features/security/IdentityContext/Identity.js";

export interface IAuthenticator {
    authenticate(token: string): Promise<IdentityData | null>;
}

/** Convert an authentication token into identity data. */
export const Authenticator = createAbstraction<IAuthenticator>("Authenticator");

export namespace Authenticator {
    export type Interface = IAuthenticator;
}
