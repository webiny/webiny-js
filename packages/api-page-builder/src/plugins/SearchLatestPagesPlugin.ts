import { SearchPagesPlugin } from "~/plugins/SearchPagesPlugin";

export class SearchLatestPagesPlugin extends SearchPagesPlugin {
    public static readonly type = "pb.elasticsearch.search-latest-pages";
}
