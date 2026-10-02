import { createAbstraction } from "@webiny/feature/admin";

/**
 * The role or team whose permissions to assume. `name` is carried alongside the id purely so the banner can say
 * whose permissions are in effect without a second query.
 */
export interface IAssumePermissionsTarget {
    type: "role" | "team";
    id: string;
    name: string;
}

/**
 * The assumed permissions as stored. `startedBy` is the id of the identity that started it: the selection
 * outlives a reload by design, so it is also there for whoever signs in next on this browser, and
 * the id is how their login tells it isn't theirs.
 */
export interface IAssumedPermissions extends IAssumePermissionsTarget {
    startedBy: string;
}

export interface IAssumePermissionsContext {
    get(): IAssumedPermissions | null;
    set(value: IAssumedPermissions | null): void;
}

export const AssumePermissionsContext = createAbstraction<IAssumePermissionsContext>(
    "AssumePermissionsContext"
);

export namespace AssumePermissionsContext {
    export type Interface = IAssumePermissionsContext;
    export type Value = IAssumedPermissions;
}

export interface IAssumePermissionsUseCase {
    execute(target: IAssumePermissionsTarget | null): Promise<void>;
}

export const AssumePermissionsUseCase = createAbstraction<IAssumePermissionsUseCase>(
    "AssumePermissionsUseCase"
);

export namespace AssumePermissionsUseCase {
    export type Interface = IAssumePermissionsUseCase;
    export type Target = IAssumePermissionsTarget;
}

export interface IAssumableTargetsDto {
    roles: Array<{ id: string; name: string }>;
    teams: Array<{ id: string; name: string }>;
}

/**
 * Fetches the roles and teams on offer AS THE SIGNED-IN USER, never as the role being previewed.
 * Every other request carries the assume-permissions header while a preview is active, and the previewed
 * role usually cannot list roles, so without the opt-out the header control would come up empty exactly
 * when someone is trying to switch from one role to the next.
 */
export interface IListAssumableTargetsGateway {
    execute(params: { includeTeams: boolean }): Promise<IAssumableTargetsDto>;
}

export const ListAssumableTargetsGateway = createAbstraction<IListAssumableTargetsGateway>(
    "ListAssumableTargetsGateway"
);

export namespace ListAssumableTargetsGateway {
    export type Interface = IListAssumableTargetsGateway;
    export type Dto = IAssumableTargetsDto;
}

export interface IListAssumableTargetsUseCase {
    execute(params: { includeTeams: boolean }): Promise<{
        roles: IAssumePermissionsTarget[];
        teams: IAssumePermissionsTarget[];
    }>;
}

export const ListAssumableTargetsUseCase = createAbstraction<IListAssumableTargetsUseCase>(
    "ListAssumableTargetsUseCase"
);

export namespace ListAssumableTargetsUseCase {
    export type Interface = IListAssumableTargetsUseCase;
    export type Target = IAssumePermissionsTarget;
}
