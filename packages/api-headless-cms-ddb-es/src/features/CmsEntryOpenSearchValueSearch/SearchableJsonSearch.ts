import { CmsEntryOpenSearchValueSearch } from "./abstractions.js";
import { SearchableJsonSearchImpl } from "~/elasticsearch/search/searchableJson.js";

export const SearchableJsonSearch = CmsEntryOpenSearchValueSearch.createImplementation({
    implementation: SearchableJsonSearchImpl,
    dependencies: []
});
