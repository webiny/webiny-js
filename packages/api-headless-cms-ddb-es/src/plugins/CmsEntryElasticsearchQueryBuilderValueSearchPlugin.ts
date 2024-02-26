import { Plugin } from "@webiny/plugins/Plugin";
import { CmsModelField } from "@webiny/api-headless-cms/types";

export interface CreatePathCallableParams<T = any> {
    field: CmsModelField;
    key: string;
    value: T;
}

export interface CreatePathCallable<T = any> {
    (params: CreatePathCallableParams<T>): string;
}

export interface TransformCallableParams<T = any> {
    field: CmsModelField;
    value: T;
}
export interface TransformCallable<T = any> {
    (params: TransformCallableParams<T>): string;
}

export interface CmsEntryElasticsearchQueryBuilderValueSearchPluginParams {
    fieldType: string;
    path?: string | CreatePathCallable;
    transform: TransformCallable;
}
export class CmsEntryElasticsearchQueryBuilderValueSearchPlugin extends Plugin {
    public static override readonly type: string = "cms-elastic-search-query-builder-value-search";

    private readonly config: CmsEntryElasticsearchQueryBuilderValueSearchPluginParams;

    public get fieldType(): string {
        return this.config.fieldType;
    }

    public constructor(params: CmsEntryElasticsearchQueryBuilderValueSearchPluginParams) {
        super();

        this.config = params;
        /**
         * There is a type on the constructor, TS just doesn't see it.
         */
        // @ts-expect-error
        this.name = `${this.constructor.type}-${this.config.fieldType}`;
    }

    public transform(params: TransformCallableParams): any {
        return this.config.transform(params);
    }

    public createPath(params: CreatePathCallableParams): string | null {
        if (typeof this.config.path === "function") {
            return this.config.path(params);
        } else if (typeof this.config.path === "string") {
            return this.config.path;
        }
        return null;
    }
}

export const createCmsEntryElasticsearchQueryBuilderValueSearchPlugin = (
    params: CmsEntryElasticsearchQueryBuilderValueSearchPluginParams
) => {
    return new CmsEntryElasticsearchQueryBuilderValueSearchPlugin(params);
};
