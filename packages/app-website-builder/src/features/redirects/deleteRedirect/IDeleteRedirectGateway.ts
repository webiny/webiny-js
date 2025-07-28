export interface IDeleteRedirectGateway {
    execute: (id: string) => Promise<void>;
}
