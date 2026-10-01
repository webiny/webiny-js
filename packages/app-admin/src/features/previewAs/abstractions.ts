import { createAbstraction } from "@webiny/feature/admin";

/**
 * The role or team to preview. `name` is carried alongside the id purely so the banner can say
 * whose permissions are in effect without a second query.
 */
export interface IPreviewTarget {
    type: "role" | "team";
    id: string;
    name: string;
}

/**
 * A preview as stored. `startedBy` is the id of the identity that started it: the selection
 * outlives a reload by design, so it is also there for whoever signs in next on this browser, and
 * the id is how their login tells it isn't theirs.
 */
export interface IActivePreview extends IPreviewTarget {
    startedBy: string;
}

export interface IPreviewContext {
    get(): IActivePreview | null;
    set(value: IActivePreview | null): void;
}

export const PreviewContext = createAbstraction<IPreviewContext>("PreviewContext");

export namespace PreviewContext {
    export type Interface = IPreviewContext;
    export type Value = IActivePreview;
}

export interface IPreviewAsUseCase {
    execute(target: IPreviewTarget | null): Promise<void>;
}

export const PreviewAsUseCase = createAbstraction<IPreviewAsUseCase>("PreviewAsUseCase");

export namespace PreviewAsUseCase {
    export type Interface = IPreviewAsUseCase;
    export type Target = IPreviewTarget;
}

/**
 * A role or team that can be previewed. The API works out what it grants, so the Admin only needs
 * enough to list it and to send it back in the preview-as header.
 */
export interface IPreviewCandidate {
    type: "role" | "team";
    id: string;
    name: string;
}

export interface IPreviewCandidatesDto {
    roles: Array<{ id: string; name: string }>;
    teams: Array<{ id: string; name: string }>;
}

/**
 * Fetches the roles and teams on offer AS THE SIGNED-IN USER, never as the role being previewed.
 * Every other request carries the preview-as header while a preview is active, and the previewed
 * role usually cannot list roles, so without the opt-out the header control would come up empty exactly
 * when someone is trying to switch from one role to the next.
 */
export interface IListPreviewCandidatesGateway {
    execute(params: { includeTeams: boolean }): Promise<IPreviewCandidatesDto>;
}

export const ListPreviewCandidatesGateway = createAbstraction<IListPreviewCandidatesGateway>(
    "ListPreviewCandidatesGateway"
);

export namespace ListPreviewCandidatesGateway {
    export type Interface = IListPreviewCandidatesGateway;
    export type Dto = IPreviewCandidatesDto;
}

export interface IListPreviewCandidatesUseCase {
    execute(params: { includeTeams: boolean }): Promise<{
        roles: IPreviewCandidate[];
        teams: IPreviewCandidate[];
    }>;
}

export const ListPreviewCandidatesUseCase = createAbstraction<IListPreviewCandidatesUseCase>(
    "ListPreviewCandidatesUseCase"
);

export namespace ListPreviewCandidatesUseCase {
    export type Interface = IListPreviewCandidatesUseCase;
    export type Candidate = IPreviewCandidate;
}
