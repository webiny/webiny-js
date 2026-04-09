import { CmsEntryOpenSearchValueSearch } from "./abstractions.js";
import { TimeSearchImpl } from "~/elasticsearch/search/timeSearch.js";

export const TimeSearch = CmsEntryOpenSearchValueSearch.createImplementation({
    implementation: TimeSearchImpl,
    dependencies: []
});
