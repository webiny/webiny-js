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
    const [activeTags, setActiveTags] = useState<TagItem[]>([]);

    const toggleTag = useCallback(
        (tag: TagItem) => {
            const finalTags = Array.isArray(activeTags) ? [...activeTags] : [];

            if (finalTags.includes(tag)) {
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
                {tags.map((tag, index) => (
                    <Tag
                        key={`tag-${index}`}
                        tag={tag}
                        active={activeTags.includes(tag)}
                        onTagClick={tag => {
                            toggleTag(tag);
                            onTagClick(tag);
                        }}
                    />
                ))}
            </>
        );
    }

    return <Empty disclaimer={emptyDisclaimer} />;
};
