export interface ICache<TItem> {
    get: () => Promise<TItem[]>;
    set: (item: TItem) => Promise<void>;
    setMultiple: (items: TItem[]) => Promise<void>;
    update: (id: string, item: TItem) => Promise<void>;
    remove: (id: string) => Promise<void>;
}
