export interface ILoadingRepository {
    get: () => Record<string, boolean>;
    set: (action: string, isLoading?: boolean) => Promise<void>;
    getActiveLoadings(): string[];
    runCallBack: <T>(callback: Promise<T>, action: string) => Promise<T>;
    isLoading: (action: string) => boolean;
    hasLoading: () => boolean;
    isEmpty: () => boolean;
}
