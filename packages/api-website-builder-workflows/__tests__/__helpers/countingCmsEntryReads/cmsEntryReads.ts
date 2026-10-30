/** Storage calls the CMS entry use cases made, of every model. Reset it per test. */
export interface CmsEntryReads {
    listLatestEntries: number;
    getEntriesByIds: number;
    getEntryById: number;
    getRevisionById: number;
    getUniqueFieldValues: number;
}

export const cmsEntryReads: CmsEntryReads = {
    listLatestEntries: 0,
    getEntriesByIds: 0,
    getEntryById: 0,
    getRevisionById: 0,
    getUniqueFieldValues: 0
};

export const resetCmsEntryReads = (): void => {
    cmsEntryReads.listLatestEntries = 0;
    cmsEntryReads.getEntriesByIds = 0;
    cmsEntryReads.getEntryById = 0;
    cmsEntryReads.getRevisionById = 0;
    cmsEntryReads.getUniqueFieldValues = 0;
};
