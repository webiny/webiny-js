import { createAbstraction } from "@webiny/feature/admin";
import { Identity } from "~/domain/Identity.js";

export interface IIdentityContext {
    getIdentity(): Identity;
    setIdentity(identity: Identity | undefined): void;
}

export const IdentityContext = createAbstraction<IIdentityContext>("IdentityContext");

export namespace IdentityContext {
    export type Interface = IIdentityContext;
}
