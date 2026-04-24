import { createAbstraction } from "@webiny/feature/api";
import type { SecurityPermission } from "~/types/security.js";
import { Identity } from "~/features/security/IdentityContext/index.js";

export interface IAuthorizer {
    authorize(identity: Identity): Promise<SecurityPermission[] | null>;
}

/** Retrieve permissions for an identity. */
export const Authorizer = createAbstraction<IAuthorizer>("Authorizer");

export namespace Authorizer {
    export type Interface = IAuthorizer;
}
