export interface ITrashBinRestoreItemGateway<TItem> {
    execute: (id: string) => Promise<TItem>;
}
