import { useContext, useEffect, useMemo } from "react";
import { SearchRecordsContext } from "~/contexts/records";
import { ListTagsWhereQueryVariables, TagItem } from "~/types";

interface UseTagsParams {
    type: string;
    tagsModifier?: (tags: TagItem[]) => TagItem[];
    initialWhere?: ListTagsWhereQueryVariables & {
        type: string;
        AND?: ListTagsWhereQueryVariables;
        OR?: ListTagsWhereQueryVariables;
    };
}

export const useTags = (params: UseTagsParams) => {
    const { type, tagsModifier, ...initialWhere } = params;

    const context = useContext(SearchRecordsContext);

    if (!context) {
        throw new Error("useTags must be used within a SearchRecordsContext");
    }

    const { tags, loading, listTags } = context;

    const tagsByType = tags[type] || [];

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
            tags:
                tagsModifier && typeof tagsModifier === "function"
                    ? tagsModifier(tagsByType)
                    : tagsByType
        }),
        [tags, loading]
    );
};
