import { createAbstraction } from "@webiny/feature/api";
import type {
    SecurityStorageOperations as ISecurityStorageOperations,
    Role,
    Team
} from "~/types/security.js";

/** Storage operations for all security entities. */
export const SecurityStorageOperations = createAbstraction<ISecurityStorageOperations>(
    "SecurityStorageOperations"
);

export namespace SecurityStorageOperations {
    export type Interface = ISecurityStorageOperations;
}

export interface IRolesProvider {
    getRoles(): Promise<Role[]>;
}

/** Provide roles defined via code-based factories. */
export const RolesProvider = createAbstraction<IRolesProvider>("RolesProvider");

export namespace RolesProvider {
    export type Interface = IRolesProvider;
}

export interface ITeamsProvider {
    getTeams(): Promise<Team[]>;
}

/** Provide teams defined via code-based factories. */
export const TeamsProvider = createAbstraction<ITeamsProvider>("TeamsProvider");

export namespace TeamsProvider {
    export type Interface = ITeamsProvider;
}
