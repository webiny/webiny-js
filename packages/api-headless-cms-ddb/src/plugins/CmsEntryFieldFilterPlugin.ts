import { Plugin } from "@webiny/plugins";
import { ValueFilterPlugin } from "@webiny/db-dynamodb/plugins/definitions/ValueFilterPlugin";
import { Field } from "~/operations/entry/filtering/types";

/**
 * This plugin is used to create the filter.
 * Internally we have default one + the one for the reference field - because it is actually an object when filtering.
 */

interface CmsEntryFieldFilterPluginParams {
    fieldType: string;
    create: (
        params: CmsEntryFieldFilterPluginCreateParams
    ) => null | CmsEntryFieldFilterPluginCreateResponse | CmsEntryFieldFilterPluginCreateResponse[];
}

interface CmsEntryFieldFilterPluginCreateParams {
    key: string;
    value: any;
    field: Field;
    operation: string;
    plugins: Record<string, ValueFilterPlugin>;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

export interface CmsEntryFieldFilterPluginCreateResponse {
    field: Field;
    path: string;
    plugin: ValueFilterPlugin;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

export class CmsEntryFieldFilterPlugin extends Plugin {
    public static override readonly type: string = "cms.field.filter";
    public static readonly ALL: string = "*";

    private readonly config: CmsEntryFieldFilterPluginParams;

    public readonly fieldType: string;

    public constructor(config: CmsEntryFieldFilterPluginParams) {
        super();
        this.config = config;
        this.fieldType = this.config.fieldType;
    }

    public create(params: CmsEntryFieldFilterPluginCreateParams) {
        return this.config.create(params);
    }
}
