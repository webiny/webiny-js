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
    (params: CmsEntryElasticsearchValuesModifierCbParams<T>): Promise<void>;
}

export interface CmsEntryElasticsearchValuesModifierExecParams<T = CmsEntryValues> {
    model: CmsModel;
    entry: CmsEntry<T>;
    values: Partial<T>;
}

export class CmsEntryElasticsearchValuesModifier<T = CmsEntryValues> extends Plugin {
    public static override readonly type: string = "cms.entry.elasticsearch.values.modifier";

    private readonly cb: CmsEntryElasticsearchValuesModifierCb<T>;

    public constructor(cb: CmsEntryElasticsearchValuesModifierCb<T>) {
        super();
        this.cb = cb;
    }

    public async exec(
        params: CmsEntryElasticsearchValuesModifierExecParams<T>
    ): Promise<Partial<T>> {
        let values: any = params.values;
        await this.cb({
            model: params.model,
            entry: params.entry,
            values,
            setValues: (cb: CmsEntryElasticsearchValuesModifierCbParamsSetValuesCb<T>) => {
                values = cb(values);
            }
        });
        return values;
    }
}

export const createCmsEntryElasticsearchValuesModifier = <T = CmsEntryValues>(
    cb: CmsEntryElasticsearchValuesModifierCb<T>
) => {
    return new CmsEntryElasticsearchValuesModifier<T>(cb);
};
