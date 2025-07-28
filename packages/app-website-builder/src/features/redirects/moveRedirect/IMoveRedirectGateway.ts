export interface IMoveRedirectGateway {
    execute: (id: string, folderId: string) => Promise<void>;
}
