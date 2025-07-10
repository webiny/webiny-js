export interface ISearchStateGateway {
    set(value: string): Promise<void>;
    get(): string;
} 