export interface MoveRedirectParams {
    id: string;
    folderId: string;
}

export interface IMoveRedirectUseCase {
    execute: (params: MoveRedirectParams) => Promise<void>;
}
