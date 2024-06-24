export interface IGetFolderRepository {
    execute: (id: string) => Promise<void>;
}
