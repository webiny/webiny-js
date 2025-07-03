export interface IGetPageRepository {
    execute: (id: string) => Promise<void>;
}
