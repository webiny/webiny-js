import { SearchPagesPlugin } from "./SearchPagesPlugin";

export class SearchLatestPagesPlugin extends SearchPagesPlugin {
    public static override readonly type: string = "pb.elasticsearch.search-latest-pages";
}
