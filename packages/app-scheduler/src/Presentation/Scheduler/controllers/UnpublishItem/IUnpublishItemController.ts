export interface IUnpublishItemController {
    execute: (id: string, scheduleOn: Date) => Promise<void>;
}
