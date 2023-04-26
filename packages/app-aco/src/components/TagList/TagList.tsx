import React from "react";

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
    const { tags, loading, updateTag } = useTags({ type, ...initialWhere, tagsModifier });

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
                        onTagClick={tag => {
                            updateTag({ ...tag, active: !tag.active });
                            onTagClick(tag);
                        }}
                    />
                ))}
            </>
        );
    }

    return <Empty disclaimer={emptyDisclaimer} />;
};
