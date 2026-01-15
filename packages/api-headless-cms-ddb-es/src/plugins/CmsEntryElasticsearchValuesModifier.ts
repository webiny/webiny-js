import { Plugin } from "@webiny/plugins";
import type { CmsEntry, CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";

interface CmsEntryElasticsearchValuesModifierCbParamsSetValuesCb<
    T extends CmsEntryValues = CmsEntryValues
> {
    (prev: T): T;
}

interface CmsEntryElasticsearchValuesModifierCbParams<T extends CmsEntryValues = CmsEntryValues> {
    model: CmsModel;
    entry: CmsEntry<T>;
    values: T;
    setValues: (cb: CmsEntryElasticsearchValuesModifierCbParamsSetValuesCb<T>) => void;
}

export interface CmsEntryElasticsearchValuesModifierCb<T extends CmsEntryValues = CmsEntryValues> {
    (params: CmsEntryElasticsearchValuesModifierCbParams<T>): void;
}

export interface CmsEntryElasticsearchValuesModifierExecParams<
    T extends CmsEntryValues = CmsEntryValues
> {
    model: CmsModel;
    entry: CmsEntry<T>;
    values: T;
}

export type CmsEntryElasticsearchValuesModifierParams<T extends CmsEntryValues = CmsEntryValues> =
    | CmsEntryElasticsearchValuesModifierCb<T>
    | {
          models: string[];
          modifier: CmsEntryElasticsearchValuesModifierCb<T>;
      };

export class CmsEntryElasticsearchValuesModifier extends Plugin {
    public static override readonly type: string = "cms.entry.elasticsearch.values.modifier";

    private readonly models?: string[] = undefined;
    private readonly cb: CmsEntryElasticsearchValuesModifierCb<any>;

    public constructor(params: CmsEntryElasticsearchValuesModifierParams<any>) {
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

    public modify<T extends CmsEntryValues = CmsEntryValues>(
        params: CmsEntryElasticsearchValuesModifierExecParams<T>
    ): T {
        const { model, entry, values: initialValues } = params;
        let values = structuredClone<T>(initialValues);
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

export const createCmsEntryElasticsearchValuesModifier = <
    T extends CmsEntryValues = CmsEntryValues
>(
    params: CmsEntryElasticsearchValuesModifierParams<T>
) => {
    return new CmsEntryElasticsearchValuesModifier(params);
};
