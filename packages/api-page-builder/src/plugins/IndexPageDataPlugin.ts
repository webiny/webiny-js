import { Plugin } from "@webiny/plugins";
import { Page, PbContext } from "../types";

interface ApplyPageDataArgs {
    data: Record<string, any>;
    page: Page;
    context: PbContext;
}

interface ApplyPageDataCallable {
    (args: ApplyPageDataArgs): void;
}

export class IndexPageDataPlugin extends Plugin {
    public static readonly type = "pb.elasticsearch.index-page-data";
    private callable: ApplyPageDataCallable;

    constructor(callable: ApplyPageDataCallable) {
        super();
        this.callable = callable;
    }

    apply(args: ApplyPageDataArgs) {
        if (typeof this.callable === "function") {
            this.callable(args);
        }
    }
}
