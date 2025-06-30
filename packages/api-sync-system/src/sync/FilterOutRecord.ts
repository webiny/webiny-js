import type { FilterOutRecordPlugin } from "~/sync/plugins/FilterOutRecordPlugin.js";
import type { ICommandValueItemExtended } from "~/sync/types.js";

export class FilterOutRecord {
    private readonly plugins: FilterOutRecordPlugin[];

    public constructor(plugins: FilterOutRecordPlugin[]) {
        this.plugins = plugins;
    }
    /**
     * If method returns `true`, the record will be filtered out.
     */
    public filterOut(item: ICommandValueItemExtended): boolean {
        for (const plugin of this.plugins) {
            if (plugin.execute(item)) {
                return true;
            }
        }
        return false;
    }
}

export const createFilterOutRecord = (plugins: FilterOutRecordPlugin[]): FilterOutRecord => {
    return new FilterOutRecord(plugins);
};
