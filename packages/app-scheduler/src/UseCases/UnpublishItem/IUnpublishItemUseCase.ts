export interface IUnpublishItemUseCase {
    execute: (id: string, scheduleOn: Date) => Promise<void>;
}
