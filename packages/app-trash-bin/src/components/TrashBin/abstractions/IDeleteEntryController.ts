export interface IDeleteEntryController {
    execute: (id: string) => Promise<void>;
}
