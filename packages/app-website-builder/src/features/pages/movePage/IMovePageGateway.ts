export interface IMovePageGateway {
    execute: (id: string, folderId: string) => Promise<void>;
}
