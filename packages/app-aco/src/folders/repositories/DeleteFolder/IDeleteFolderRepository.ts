export interface IDeleteFolderRepository {
    execute: (id: string) => Promise<void>;
}
