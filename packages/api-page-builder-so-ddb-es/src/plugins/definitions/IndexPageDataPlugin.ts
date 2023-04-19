import { Plugin, PluginsContainer } from "@webiny/plugins";
import { Page } from "@webiny/api-page-builder/types";

interface ApplyPageDataParams<TPage, TData = Record<string, any>> {
    data: TData;
    input: Record<string, any>;
    page: TPage;
    plugins: PluginsContainer;
}

interface ApplyPageDataCallable<TPage, TData> {
    (params: ApplyPageDataParams<TPage, TData>): void;
}

export class IndexPageDataPlugin<
    TPage extends Page = Page,
    TData = Record<string, any>
> extends Plugin {
    public static override readonly type: string = "pb.elasticsearch.index-page-data";
    private readonly callable: ApplyPageDataCallable<TPage, TData>;

    public constructor(callable: ApplyPageDataCallable<TPage, TData>) {
        super();
        this.callable = callable;
    }

    public apply(params: ApplyPageDataParams<TPage, TData>): void {
        if (typeof this.callable !== "function") {
            return;
        }
        this.callable(params);
    }
}
