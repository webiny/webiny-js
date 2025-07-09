export interface IQueryGateway {
    get: () => Promise<string>;
    set: (value?: string) => Promise<void>;
}
