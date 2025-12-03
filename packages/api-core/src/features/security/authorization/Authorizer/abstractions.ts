import { createAbstraction } from "@webiny/feature/api";
import type { SecurityPermission } from "~/types/security.js";

export interface IAuthorizer {
    authorize(): Promise<SecurityPermission[] | null>;
}

export const Authorizer = createAbstraction<IAuthorizer>("Authorizer");

export namespace Authorizer {
    export type Interface = IAuthorizer;
}
