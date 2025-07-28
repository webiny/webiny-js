export interface IMoveRedirectRepository {
    execute: (id: string, folderId: string) => Promise<void>;
}
