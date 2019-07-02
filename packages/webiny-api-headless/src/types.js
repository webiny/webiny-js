import type { PluginType } from "webiny-plugins/types";

export type SetValueOptions = {
    models: [Object],
    model: Object,
    context: Object,
    field: Object
};

export type DbEntry = {
    get(key: string): any,
    set(key: string, value: any): void,
    beforeSave(fn: Function): void,
    afterSave(fn: Function): void,
    save(): Promise<void>
};

export type HeadlessFieldTypePlugin = PluginType & {
    isSortable: boolean,
    fieldType: string,
    read: {
        createTypeField({ model: Object, field: Object }): string,
        createResolver({ models: [Object], model: Object, field: Object }): Function
    },
    manage: {
        createTypes({ models: [Object], model: Object }): string,
        createTypeField({ model: Object, field: Object }): string,
        createInputField({ model: Object, field: Object }): string,
        createResolver({ models: [Object], model: Object, field: Object }): Function,
        setEntryFieldValue(value: any, entry: DbEntry, options: SetValueOptions): void
    }
};
