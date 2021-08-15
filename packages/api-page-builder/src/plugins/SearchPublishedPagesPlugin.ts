import { SearchPagesPlugin } from "~/plugins/SearchPagesPlugin";

export class SearchPublishedPagesPlugin extends SearchPagesPlugin {
    public static readonly type = "pb.elasticsearch.search-published-pages";
}
