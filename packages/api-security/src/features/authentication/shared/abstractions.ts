import { createAbstraction } from "@webiny/feature/api";
import type { Identity } from "~/features/IdentityContext/Identity.js";

export interface IAuthenticator {
    authenticate(token: string): Promise<Identity | null>;
}

export const Authenticator = createAbstraction<IAuthenticator>("Authenticator");

export namespace Authenticator {
    export type Interface = IAuthenticator;
}
