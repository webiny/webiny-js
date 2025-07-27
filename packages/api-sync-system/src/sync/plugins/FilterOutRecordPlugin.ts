import { Plugin } from "@webiny/plugins/Plugin.js";
import type { ICommandValueItemExtended } from "~/sync/types.js";

export interface IFilterOutRecordPluginCallable {
    (record: ICommandValueItemExtended): boolean;
}

export interface IFilterOutRecordPluginParams {
    /**
     * Filter out returns true if the record should be filtered out.
     */
    filterOut: IFilterOutRecordPluginCallable;
    name: string;
}

export class FilterOutRecordPlugin extends Plugin {
    public static override readonly type: string = "sync.filterOut.record";

    private readonly cb: IFilterOutRecordPluginCallable;

    public constructor(params: IFilterOutRecordPluginParams) {
        super();
        this.name = params.name;
        this.cb = params.filterOut;
    }
    /**
     * If method returns `true`, the record will be filtered out.
     */
    public execute(item: ICommandValueItemExtended): boolean {
        return this.cb(item);
    }

    public static createName(name: string): string {
        return `${FilterOutRecordPlugin.type}.${name}`;
    }
}

export const createFilterOutRecordPlugin = (
    params: IFilterOutRecordPluginParams
): FilterOutRecordPlugin => {
    return new FilterOutRecordPlugin(params);
};
