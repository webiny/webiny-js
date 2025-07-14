export interface IFilterRepository {
    get: () => Record<string, any>;
    set: (filters: Record<string, any>) => Promise<void>;
    reset: () => Promise<void>;
    hasFilters: () => boolean;
}
