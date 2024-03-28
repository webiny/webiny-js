export interface IDeleteItemUseCase {
    execute: (id: string) => Promise<void>;
}
