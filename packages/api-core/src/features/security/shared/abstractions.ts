import { createAbstraction } from "@webiny/feature/api";
import type {
    SecurityStorageOperations as ISecurityStorageOperations,
    Role,
    Team
} from "~/types/security.js";

/**
 * SecurityStorageOperations abstraction
 * Provides access to all storage operations for security entities
 */
export const SecurityStorageOperations = createAbstraction<ISecurityStorageOperations>(
    "SecurityStorageOperations"
);

export namespace SecurityStorageOperations {
    export type Interface = ISecurityStorageOperations;
}

/**
 * RolesProvider abstraction
 * Provides roles defined via factories
 */
export interface IRolesProvider {
    getRoles(): Promise<Role[]>;
}

export const RolesProvider = createAbstraction<IRolesProvider>("RolesProvider");

export namespace RolesProvider {
    export type Interface = IRolesProvider;
}

/**
 * TeamsProvider abstraction
 * Provides teams defined via factories
 */
export interface ITeamsProvider {
    getTeams(): Promise<Team[]>;
}

export const TeamsProvider = createAbstraction<ITeamsProvider>("TeamsProvider");

export namespace TeamsProvider {
    export type Interface = ITeamsProvider;
}
