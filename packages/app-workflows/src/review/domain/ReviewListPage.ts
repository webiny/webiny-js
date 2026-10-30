import type { ReviewListMeta } from "./types.js";
import type { ReviewWithFlags } from "./types.js";

// One page of a review list: the mapped reviews and where the next page starts.
export interface ReviewListPage {
    items: ReviewWithFlags[];
    meta: ReviewListMeta;
}
