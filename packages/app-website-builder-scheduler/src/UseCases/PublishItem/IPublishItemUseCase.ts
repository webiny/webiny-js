export interface IPublishItemUseCase {
    execute: (id: string, scheduleOn: Date) => Promise<void>;
}
