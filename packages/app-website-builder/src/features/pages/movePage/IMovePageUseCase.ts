export interface MovePageParams {
    id: string;
    folderId: string;
}

export interface IMovePageUseCase {
    execute: (params: MovePageParams) => Promise<void>;
}
