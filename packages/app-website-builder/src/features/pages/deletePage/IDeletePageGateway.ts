export interface IDeletePageGateway {
    execute: (id: string) => Promise<void>;
}
