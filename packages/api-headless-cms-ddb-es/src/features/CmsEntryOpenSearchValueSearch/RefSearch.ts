import { CmsEntryOpenSearchValueSearch } from "./abstractions.js";
import { RefSearchImpl } from "~/elasticsearch/search/refSearch.js";

export const RefSearch = CmsEntryOpenSearchValueSearch.createImplementation({
    implementation: RefSearchImpl,
    dependencies: []
});
