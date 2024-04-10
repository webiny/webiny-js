export interface IDeleteItemController {
    execute: (id: string) => Promise<void>;
}
