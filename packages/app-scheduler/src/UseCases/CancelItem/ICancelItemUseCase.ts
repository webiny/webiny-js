export interface ICancelItemUseCase {
    execute: (id: string) => Promise<void>;
}
