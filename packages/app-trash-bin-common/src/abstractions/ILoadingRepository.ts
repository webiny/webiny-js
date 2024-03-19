export interface ILoadingRepository {
    init: (loadingEnum: any) => Promise<void>;
    get: () => Record<string, boolean>;
    set: (key: string, isLoading?: boolean) => Promise<void>;
}
