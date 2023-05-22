import { useContext, useEffect, useMemo } from "react";
import { SearchRecordsContext } from "~/contexts/records";
import { ListTagsWhereQueryVariables, TagItem } from "~/types";
import { useAcoApp } from "~/hooks/useAcoApp";

interface UseTagsParams {
    tagsModifier?: (tags: TagItem[]) => TagItem[];
    where?: ListTagsWhereQueryVariables;
}

export const useTags = (params: UseTagsParams) => {
    const { tagsModifier, where } = params;

    const context = useContext(SearchRecordsContext);
    const { app } = useAcoApp();

    if (!context) {
        throw new Error("useTags must be used within a SearchRecordsContext");
    }

    const { tags, loading, listTags } = context;

    useEffect(() => {
        listTags({ where });
    }, [app.id]);

    return useMemo(
        () => ({
            /**
             * NOTE: you do NOT need to call `listTags` from this hook on component mount, because you already have tags in the `listTags` property.
             * As soon as you call `useTags()`, you'll initiate fetching of `tags`, which is managed by the `SearchRecordContext`.
             */
            loading,
            tags: tagsModifier && typeof tagsModifier === "function" ? tagsModifier(tags) : tags
        }),
        [tags, loading]
    );
};
