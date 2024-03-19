export interface LoadingPresenterViewModel {
    loading: Record<string, boolean>;
}

export interface ILoadingPresenter {
    init: () => Promise<void>;
    get vm(): LoadingPresenterViewModel;
}
