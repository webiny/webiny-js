export interface ICancelItemController {
    execute: (id: string) => Promise<void>;
}
