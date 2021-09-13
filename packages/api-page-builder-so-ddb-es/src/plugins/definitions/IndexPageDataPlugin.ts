import { Plugin } from "@webiny/plugins";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { Page } from "@webiny/api-page-builder/types";

interface ApplyPageDataParams<TPage> {
    data: Record<string, any>;
    page: TPage;
    context: PbContext;
}

interface ApplyPageDataCallable<TPage> {
    (params: ApplyPageDataParams<TPage>): void;
}

export class IndexPageDataPlugin<TPage extends Page = Page> extends Plugin {
    public static readonly type = "pb.elasticsearch.index-page-data";
    private readonly callable: ApplyPageDataCallable<TPage>;

    constructor(callable: ApplyPageDataCallable<TPage>) {
        super();
        this.callable = callable;
    }

    apply(params: ApplyPageDataParams<TPage>) {
        if (typeof this.callable !== "function") {
            return;
        }
        this.callable(params);
    }
}
