export interface ISearchRepository {
    get: () => string;
    set: (value: string) => Promise<void>;
}
