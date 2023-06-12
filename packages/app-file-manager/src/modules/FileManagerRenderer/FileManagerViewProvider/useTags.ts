import { useCallback, useEffect, useState } from "react";
import { useSecurity } from "@webiny/app-security";
import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext";
import { DEFAULT_SCOPE } from "~/constants";
import { FileTag } from "~/types";

interface UseTagsParams {
    scope?: string;
    own?: boolean;
}

export const useTags = ({ scope, own }: UseTagsParams) => {
    const { identity } = useSecurity();
    const fileManager = useFileManagerApi();
    const [tags, setTags] = useState<FileTag[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const where = getTagsInitialParams({ scope, own });
        fileManager.listTags({ where }).then(tags => {
            setLoading(false);
            setTags(tagsModifier(tags));
        });
    }, []);

    const getTagsInitialParams = useCallback(
        ({ scope, own }: UseTagsParams) => {
            return {
                ...(own && { createdBy: identity?.id }),
                ...(scope ? { tags_startsWith: scope } : { tags_not_startsWith: DEFAULT_SCOPE })
            };
        },
        [scope, own, identity]
    );

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
        tags
    };
};
