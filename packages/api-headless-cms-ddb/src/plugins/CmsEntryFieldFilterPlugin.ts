import { Plugin } from "@webiny/plugins";
import { ValueFilterPlugin } from "@webiny/db-dynamodb/plugins/definitions/ValueFilterPlugin";
import { Field } from "~/operations/entry/filtering/types";
import { CmsFieldFilterValueTransformPlugin } from "~/types";

/**
 * This plugin is used to create the filter.
 * Internally we have default one + the one for the reference field - because it is actually an object when filtering.
 */

interface CmsEntryFieldFilterPluginParams<T = any> {
    fieldType: string;
    create: (
        params: CmsEntryFieldFilterPluginCreateParams<T>
    ) => null | CmsEntryFieldFilterPluginCreateResponse | CmsEntryFieldFilterPluginCreateResponse[];
}

interface CmsEntryFieldFilterPluginCreateParams<T = any> {
    key: string;
    value: T;
    field: Field;
    fields: Record<string, Field>;
    operation: string;
    valueFilterPlugins: Record<string, ValueFilterPlugin>;
    transformValuePlugins: Record<string, CmsFieldFilterValueTransformPlugin>;
    getFilterCreatePlugin: (type: string) => CmsEntryFieldFilterPlugin;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

export interface CmsEntryFieldFilterPluginCreateResponse {
    field: Field;
    path: string;
    fieldPathId: string;
    plugin: ValueFilterPlugin;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

export class CmsEntryFieldFilterPlugin<T = any> extends Plugin {
    public static override readonly type: string = "cms.dynamodb.entry.field.filter";
    public static readonly ALL: string = "*";

    private readonly config: CmsEntryFieldFilterPluginParams<T>;

    public readonly fieldType: string;

    public constructor(config: CmsEntryFieldFilterPluginParams<T>) {
        super();
        this.config = config;
        this.fieldType = this.config.fieldType;
    }

    public create(params: CmsEntryFieldFilterPluginCreateParams<T>) {
        return this.config.create(params);
    }
}
