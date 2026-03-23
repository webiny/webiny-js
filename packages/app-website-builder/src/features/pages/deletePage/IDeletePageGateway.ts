export interface IDeletePageGateway {
    execute: (id: string, permanently: boolean) => Promise<void>;
}
