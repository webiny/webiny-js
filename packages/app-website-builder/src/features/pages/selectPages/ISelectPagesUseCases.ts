export interface ISelectPagesUseCase<T = any> {
    execute: (pages: T[]) => Promise<void>;
}
