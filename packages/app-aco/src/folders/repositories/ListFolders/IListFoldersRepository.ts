export interface IListFoldersRepository {
    execute: (type: string) => Promise<void>;
}
