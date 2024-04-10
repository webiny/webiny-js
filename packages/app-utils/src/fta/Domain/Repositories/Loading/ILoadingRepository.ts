export interface ILoadingRepository {
    get: () => Record<string, boolean>;
    set: (action: string, isLoading?: boolean) => Promise<void>;
    runCallBack: <T>(callback: Promise<T>, action: string) => Promise<T>;
}
