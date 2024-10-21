export interface IDeleteFolderGateway {
    execute: (id: string) => Promise<void>;
}
