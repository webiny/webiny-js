export interface ICache<TItem> {
    hasItems: () => boolean;
    getItems: () => TItem[];
    getItem: (id: string) => TItem | undefined;
    set: (item: TItem) => Promise<void>;
    setMultiple: (items: TItem[]) => Promise<void>;
    update: (id: string, item: TItem) => Promise<void>;
    remove: (id: string) => Promise<void>;
}
