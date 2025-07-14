export interface ISelectedItemsRepository<T = any> {
    selectItems: (items: T[]) => Promise<void>;
    selectAllItems: () => Promise<void>;
    unselectAllItems: () => Promise<void>;
    getSelectedItems: () => T[];
    getSelectedAllItems: () => boolean;
}
