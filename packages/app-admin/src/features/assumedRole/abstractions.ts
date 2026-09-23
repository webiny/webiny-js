import { createAbstraction } from "@webiny/feature/admin";

/**
 * The role or team the Admin is currently previewing. `name` is carried alongside the id purely so
 * the banner can say whose permissions are in effect without a second query.
 */
export interface IAssumedRole {
    type: "role" | "team";
    id: string;
    name: string;
}

export interface IAssumedRoleContext {
    get(): IAssumedRole | null;
    set(value: IAssumedRole | null): void;
}

export const AssumedRoleContext = createAbstraction<IAssumedRoleContext>("AssumedRoleContext");

export namespace AssumedRoleContext {
    export type Interface = IAssumedRoleContext;
    export type Value = IAssumedRole;
}

export interface IAssumeRoleUseCase {
    execute(value: IAssumedRole | null): Promise<void>;
}

export const AssumeRoleUseCase = createAbstraction<IAssumeRoleUseCase>("AssumeRoleUseCase");

export namespace AssumeRoleUseCase {
    export type Interface = IAssumeRoleUseCase;
}

/**
 * A role or team that can be previewed, with its effective permissions resolved. For a team those
 * are the union of its roles' permissions, which is what the API grants a member of it.
 */
export interface IAssumableRole {
    type: "role" | "team";
    id: string;
    name: string;
    description: string;
    permissions: Array<{ name: string; [key: string]: unknown }>;
}

export interface IAssumableRolesDto {
    roles: Array<{
        id: string;
        name: string;
        description: string | null;
        permissions: Array<{ name: string; [key: string]: unknown }>;
    }>;
    teams: Array<{
        id: string;
        name: string;
        description: string | null;
        roles?: Array<{ id: string }>;
    }>;
}

/**
 * Fetches the roles and teams on offer AS THE SIGNED-IN USER, never as the role being previewed.
 * Every other request carries the assume-role header while a preview is active, and the previewed
 * role usually cannot list roles, so without the opt-out the picker would come up empty exactly
 * when someone is trying to switch from one role to the next.
 */
export interface IListAssumableRolesGateway {
    execute(params: { includeTeams: boolean }): Promise<IAssumableRolesDto>;
}

export const ListAssumableRolesGateway = createAbstraction<IListAssumableRolesGateway>(
    "ListAssumableRolesGateway"
);

export namespace ListAssumableRolesGateway {
    export type Interface = IListAssumableRolesGateway;
    export type Dto = IAssumableRolesDto;
}

export interface IListAssumableRolesUseCase {
    execute(params: { includeTeams: boolean }): Promise<{
        roles: IAssumableRole[];
        teams: IAssumableRole[];
    }>;
}

export const ListAssumableRolesUseCase = createAbstraction<IListAssumableRolesUseCase>(
    "ListAssumableRolesUseCase"
);

export namespace ListAssumableRolesUseCase {
    export type Interface = IListAssumableRolesUseCase;
    export type Role = IAssumableRole;
}
