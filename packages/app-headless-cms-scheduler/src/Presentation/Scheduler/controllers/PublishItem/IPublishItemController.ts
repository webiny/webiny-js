export interface IPublishItemController {
    execute: (id: string, scheduleOn: Date) => Promise<void>;
}
