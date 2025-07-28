export interface ISelectRedirectsUseCase<T = any> {
    execute: (redirects: T[]) => Promise<void>;
}
