import { useContext, useEffect, useMemo } from "react";
import { SearchRecordsContext } from "~/contexts/records";
import { TagItem } from "~/types";

export const useTags = (type: string) => {
    const context = useContext(SearchRecordsContext);

    if (!context) {
        throw new Error("useTags must be used within a SearchRecordsContext");
    }

    const { tags, loading, listTags, updateTag } = context;

    useEffect(() => {
        /**
         * On first mount, call `listRecords`, which will either issue a network request, or load links from cache.
         * We don't need to store the result of it to any local state; that is managed by the context provider.
         */
        if (type) {
            listTags({ type });
        }
    }, [type]);

    return useMemo(
        () => ({
            /**
             * NOTE: you do NOT need to call `listRecords` from this hook on component mount, because you already have folders in the `listRecords` property.
             * As soon as you call `useRecords()`, you'll initiate fetching of `records`, which is managed by the `SearchRecordContext`.
             * Since this method lists records with pagination, you might need to call it multiple times passing the `after` param.
             */
            loading,
            tags: tags[type],
            updateTag(tag: TagItem) {
                return updateTag(tag, type);
            }
        }),
        [tags, loading]
    );
};
