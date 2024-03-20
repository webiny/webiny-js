export interface ISearchRepository {
    init: () => Promise<void>;
    get: () => string;
    set: (query: string) => Promise<void>;
}
