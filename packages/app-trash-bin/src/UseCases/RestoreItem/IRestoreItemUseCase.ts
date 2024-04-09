export interface IRestoreItemUseCase {
    execute: (id: string) => Promise<void>;
}
