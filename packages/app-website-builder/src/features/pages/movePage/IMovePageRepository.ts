export interface IMovePageRepository {
    execute: (id: string, folderId: string) => Promise<void>;
}
