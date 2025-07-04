export interface IDeletePageGateway {
    execute: (entryId: string) => Promise<void>;
}
