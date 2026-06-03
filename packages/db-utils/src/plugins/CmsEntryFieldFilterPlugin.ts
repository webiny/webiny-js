import { Plugin } from "@webiny/plugins";
import type { Field } from "~/filtering/fields/types.js";
import type { ICmsFieldFilterValueTransformPlugin } from "./CmsFieldFilterValueTransformPlugin.js";
import { ValueFilterRegistry } from "~/valueFilter/abstractions/ValueFilterRegistry.js";

/*
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
    valueFilterRegistry: ValueFilterRegistry.Interface;
    transformValuePlugins: Record<string, ICmsFieldFilterValueTransformPlugin>;
    getFilterCreatePlugin: (type: string) => CmsEntryFieldFilterPlugin;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

export interface CmsEntryFieldFilterPluginCreateResponse {
    field: Field;
    path: string;
    fieldPathId: string;
    filter: ValueFilterRegistry.Filter;
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
