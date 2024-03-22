export interface ILoadingRepository {
    init: () => Promise<void>;
    get: () => Record<string, boolean>;
    set: (key: string, isLoading?: boolean) => Promise<void>;
    runCallBack: (callback: Promise<any>, key: string) => Promise<any>;
}
