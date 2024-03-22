export interface ILoadingRepository {
    init: () => Promise<void>;
    get: () => Record<string, boolean>;
    set: (action: string, isLoading?: boolean) => Promise<void>;
    runCallBack: (callback: Promise<any>, action: string) => Promise<any>;
}
