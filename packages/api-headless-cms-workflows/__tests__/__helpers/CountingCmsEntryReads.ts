import type { Container } from "@webiny/di";
import { countListLatestEntriesReads } from "./countingCmsEntryReads/CountingListLatestEntries.js";
import { countGetEntriesByIdsReads } from "./countingCmsEntryReads/CountingGetEntriesByIds.js";
import { countGetEntryByIdReads } from "./countingCmsEntryReads/CountingGetEntryById.js";
import { countGetRevisionByIdReads } from "./countingCmsEntryReads/CountingGetRevisionById.js";
import { countGetUniqueFieldValuesReads } from "./countingCmsEntryReads/CountingGetUniqueFieldValues.js";

export type { CmsEntryReads } from "./countingCmsEntryReads/cmsEntryReads.js";
export { cmsEntryReads, resetCmsEntryReads } from "./countingCmsEntryReads/cmsEntryReads.js";

/** Registers decorators that count the CMS entry reads into `cmsEntryReads`. */
export const countCmsEntryReads = (container: Container): void => {
    countListLatestEntriesReads(container);
    countGetEntriesByIdsReads(container);
    countGetEntryByIdReads(container);
    countGetRevisionByIdReads(container);
    countGetUniqueFieldValuesReads(container);
};
