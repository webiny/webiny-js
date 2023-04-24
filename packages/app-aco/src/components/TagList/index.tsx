import React from "react";

import { useTags } from "~/hooks";

import { Loader } from "./Loader";
import { Empty } from "./Empty";
import { Tag } from "~/components/TagList/Tag";
import { TagItem } from "~/types";

type TagListProps = {
    type: string;
    tags_startsWith?: string;
    tags_not_startsWith?: string;
    onTagClick: (tag: TagItem) => void;
    emptyDisclaimer: string;
};

export const TagList: React.FC<TagListProps> = ({
    type,
    tags_startsWith,
    tags_not_startsWith,
    onTagClick,
    emptyDisclaimer
}) => {
    const { tags, updateTag } = useTags({ type, tags_startsWith, tags_not_startsWith });

    if (!tags) {
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

    return (
        <>
            <Empty disclaimer={emptyDisclaimer} />
        </>
    );
};
