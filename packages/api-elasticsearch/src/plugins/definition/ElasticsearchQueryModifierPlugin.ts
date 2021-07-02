import { Plugin } from "@webiny/plugins";
import { ElasticsearchQueryModifierPluginParams } from "~/types";
import WebinyError from "@webiny/error";

interface Callable<
    T extends ElasticsearchQueryModifierPluginParams = ElasticsearchQueryModifierPluginParams
> {
    (params: T): string;
}

export class ElasticsearchQueryModifierPlugin extends Plugin {
    public static readonly type = "elasticsearch.queryBuilder.modifier";
    private readonly _callable?: Callable;

    public constructor(callable?: Callable) {
        super();
        this._callable = callable;
    }

    public apply<
        P extends ElasticsearchQueryModifierPluginParams = ElasticsearchQueryModifierPluginParams
    >(params: P): void {
        if (!this._callable) {
            throw new WebinyError(`Missing callable in the "${this.constructor.name}".`);
        }
        this._callable(params);
    }
}
