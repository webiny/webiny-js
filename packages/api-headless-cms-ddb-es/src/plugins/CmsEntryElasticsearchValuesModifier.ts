import { Plugin } from "@webiny/plugins";
import { CmsEntry, CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types";

interface CmsEntryElasticsearchValuesModifierCbParamsSetValuesCb<T = CmsEntryValues> {
    (prev: Partial<T>): Partial<T>;
}

interface CmsEntryElasticsearchValuesModifierCbParams<T = CmsEntryValues> {
    model: CmsModel;
    entry: CmsEntry<T>;
    values: T;
    setValues: (cb: CmsEntryElasticsearchValuesModifierCbParamsSetValuesCb<T>) => void;
}

export interface CmsEntryElasticsearchValuesModifierCb<T = CmsEntryValues> {
    (params: CmsEntryElasticsearchValuesModifierCbParams<T>): void;
}

export interface CmsEntryElasticsearchValuesModifierExecParams<T = CmsEntryValues> {
    model: CmsModel;
    entry: CmsEntry<T>;
    values: Partial<T>;
}

export type CmsEntryElasticsearchValuesModifierParams<T> =
    | CmsEntryElasticsearchValuesModifierCb<T>
    | {
          models: string[];
          modifier: CmsEntryElasticsearchValuesModifierCb<T>;
      };

export class CmsEntryElasticsearchValuesModifier<T = CmsEntryValues> extends Plugin {
    public static override readonly type: string = "cms.entry.elasticsearch.values.modifier";

    private readonly models?: string[] = undefined;
    private readonly cb: CmsEntryElasticsearchValuesModifierCb<T>;

    public constructor(params: CmsEntryElasticsearchValuesModifierParams<T>) {
        super();
        if (typeof params === "function") {
            this.cb = params;
        } else {
            this.cb = params.modifier;
            this.models = params.models.length > 0 ? params.models : undefined;
        }
    }

    public canModify(modelId: string): boolean {
        if (!this.models?.length) {
            return true;
        }
        return this.models.includes(modelId);
    }

    public modify(params: CmsEntryElasticsearchValuesModifierExecParams<T>): Partial<T> {
        const { model, entry, values: initialValues } = params;
        let values: any = initialValues;
        this.cb({
            model,
            entry,
            values,
            setValues: (cb: CmsEntryElasticsearchValuesModifierCbParamsSetValuesCb<T>) => {
                values = cb(values);
            }
        });
        return values;
    }
}

export const createCmsEntryElasticsearchValuesModifier = <T = CmsEntryValues>(
    params: CmsEntryElasticsearchValuesModifierParams<T>
) => {
    return new CmsEntryElasticsearchValuesModifier<T>(params);
};
