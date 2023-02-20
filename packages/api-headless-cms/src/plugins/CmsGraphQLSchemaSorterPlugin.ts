import { Plugin } from "@webiny/plugins";
import { CmsModel } from "~/types";

interface CmsGraphQLSchemaSorterPluginCallableParams {
    model: CmsModel;
    sorters: string[];
}
interface CmsGraphQLSchemaSorterPluginCallable {
    (params: CmsGraphQLSchemaSorterPluginCallableParams): string[];
}
export class CmsGraphQLSchemaSorterPlugin extends Plugin {
    public static override readonly type: string = "cms.graphql.schema.sorter";

    private readonly cb: CmsGraphQLSchemaSorterPluginCallable;
    public constructor(cb: CmsGraphQLSchemaSorterPluginCallable) {
        super();

        this.cb = cb;
    }
    /**
     * Method must return new sorting array. Or existing one if no changes are made.
     */
    public createSorter(params: CmsGraphQLSchemaSorterPluginCallableParams): string[] {
        return this.cb(params);
    }
}

export const createCmsGraphQLSchemaSorterPlugin = (
    cb: CmsGraphQLSchemaSorterPluginCallable
): CmsGraphQLSchemaSorterPlugin => {
    return new CmsGraphQLSchemaSorterPlugin(cb);
};
