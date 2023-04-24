import { useContext, useEffect, useMemo } from "react";
import { SearchRecordsContext } from "~/contexts/records";
import { TagItem } from "~/types";

interface UseTagsParams {
    type: string;
    initialWhere?: Record<string, any>;
}

export const useTags = (params: UseTagsParams) => {
    const { type, ...initialWhere } = params;

    const context = useContext(SearchRecordsContext);

    if (!context) {
        throw new Error("useTags must be used within a SearchRecordsContext");
    }

    const { tags, loading, listTags, updateTag } = context;

    useEffect(() => {
        /**
         * On first mount, call `listTags`, which will either issue a network request, or load tags from cache.
         * We don't need to store the result of it to any local state; that is managed by the context provider.
         */
        if (type) {
            listTags({ type, ...initialWhere });
        }
    }, [type]);

    return useMemo(
        () => ({
            /**
             * NOTE: you do NOT need to call `listTags` from this hook on component mount, because you already have tags in the `listTags` property.
             * As soon as you call `useTags()`, you'll initiate fetching of `tags`, which is managed by the `SearchRecordContext`.
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
