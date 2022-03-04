import { SearchPagesPlugin } from "./SearchPagesPlugin";

export class SearchPublishedPagesPlugin extends SearchPagesPlugin {
    public static override readonly type: string = "pb.elasticsearch.search-published-pages";
}
