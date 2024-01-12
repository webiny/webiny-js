import { useCallback, useEffect, useMemo, useState } from "react";
import { useSecurity } from "@webiny/app-security";
import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext";
import { DEFAULT_SCOPE } from "~/constants";
import { FileTag } from "~/types";

const sortTags = (tags: FileTag[]) => {
    return tags.sort((a, b) => a.tag.localeCompare(b.tag));
};

interface UseTagsParams {
    scope?: string;
    own?: boolean;
}

export const useTags = ({ scope, own }: UseTagsParams) => {
    const { identity } = useSecurity();
    const fileManager = useFileManagerApi();
    const [tags, setSortedTags] = useState<FileTag[]>([]);
    const [loading, setLoading] = useState(false);

    const getTagsInitialParams = useCallback(
        ({ scope, own }: UseTagsParams) => {
            return {
                ...(own && { createdBy: identity?.id }),
                ...(scope ? { tags_startsWith: scope } : { tags_not_startsWith: DEFAULT_SCOPE })
            };
        },
        [scope, own, identity]
    );

    const setTags = useCallback((tags: FileTag[]) => {
        setSortedTags(state => {
            const uniqueTags = tags.filter(tag => !state.some(t => t.tag === tag.tag));

            return sortTags([...state, ...uniqueTags]);
        });
    }, []);

    const where = useMemo(() => getTagsInitialParams({ scope, own }), [getTagsInitialParams]);

    useEffect(() => {
        setLoading(true);
        fileManager.listTags({ where }).then(tags => {
            setLoading(false);
            setTags(tagsModifier(tags));
        });
    }, []);

    const addTags = (tags: string[]) => {
        if (!tags.length) {
            return;
        }

        const newTags = tagsModifier(tags.map(tag => ({ tag, count: 1 })));

        setTags(newTags);

        fileManager.listTags({ where, refetch: true });
    };

    const tagsModifier = useCallback(
        (tags: FileTag[]) => {
            return tags
                .filter(({ tag }) => tag !== scope)
                .filter(({ tag }) => !tag.startsWith("mime:"))
                .map(item => {
                    const tagName = scope ? item.tag.replace(`${scope}:`, "") : item.tag;
                    return {
                        ...item,
                        tag: tagName
                    };
                });
        },
        [scope]
    );

    return {
        loading,
        tags,
        addTags
    };
};
