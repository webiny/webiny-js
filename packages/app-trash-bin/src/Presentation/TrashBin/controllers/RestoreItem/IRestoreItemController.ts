export interface IRestoreItemController {
    execute: (id: string) => Promise<void>;
}
