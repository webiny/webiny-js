import { createAbstraction } from "@webiny/feature/api";
import type { SecurityStorageOperations as ISecurityStorageOperations, Group, Team } from "~/types.js";

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
 * GroupsProvider abstraction
 * Provides groups defined via plugins
 */
export interface IGroupsProvider {
    (): Promise<Group[]>;
}

export const GroupsProvider = createAbstraction<IGroupsProvider>("GroupsProvider");

export namespace GroupsProvider {
    export type Interface = IGroupsProvider;
}

/**
 * TeamsProvider abstraction
 * Provides teams defined via plugins
 */
export interface ITeamsProvider {
    (): Promise<Team[]>;
}

export const TeamsProvider = createAbstraction<ITeamsProvider>("TeamsProvider");

export namespace TeamsProvider {
    export type Interface = ITeamsProvider;
}
