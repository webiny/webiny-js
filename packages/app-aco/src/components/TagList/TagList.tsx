import React, { useCallback, useState } from "react";

import { useTags } from "~/hooks";

import { Loader } from "./Loader";
import { Empty } from "./Empty";
import { Tag } from "./Tag";

import { ListTagsWhereQueryVariables, TagItem } from "~/types";

type TagListProps = {
    type: string;
    initialWhere?: ListTagsWhereQueryVariables & {
        AND?: ListTagsWhereQueryVariables;
        OR?: ListTagsWhereQueryVariables;
    };
    tagsModifier?: (tags: TagItem[]) => TagItem[];
    onTagClick: (tag: TagItem) => void;
    emptyDisclaimer: string;
};

export const TagList: React.FC<TagListProps> = ({
    type,
    initialWhere,
    onTagClick,
    emptyDisclaimer,
    tagsModifier
}) => {
    const { tags, loading } = useTags({ type, ...initialWhere, tagsModifier });
    const [activeTags, setActiveTags] = useState<TagItem["tag"][]>([]);

    const toggleTag = useCallback(
        (tag: TagItem["tag"]) => {
            const finalTags = Array.isArray(activeTags) ? [...activeTags] : [];

            if (finalTags.find(item => tag === item)) {
                finalTags.splice(finalTags.indexOf(tag), 1);
            } else {
                finalTags.push(tag);
            }

            setActiveTags(finalTags);
        },
        [activeTags]
    );

    if (!tags.length && (loading.INIT || loading.LIST)) {
        return <Loader />;
    }

    if (tags.length > 0) {
        return (
            <>
                {tags.map((tagItem, index) => (
                    <Tag
                        key={`tag-${index}`}
                        tagItem={tagItem}
                        active={activeTags.includes(tagItem.tag)}
                        onTagClick={tagItem => {
                            toggleTag(tagItem.tag);
                            onTagClick(tagItem);
                        }}
                    />
                ))}
            </>
        );
    }

    return <Empty disclaimer={emptyDisclaimer} />;
};
