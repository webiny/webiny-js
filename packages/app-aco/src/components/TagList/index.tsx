import React from "react";

import { useTags } from "~/hooks";

import { Loader } from "./Loader";
import { Empty } from "./Empty";
import { Tag } from "~/components/TagList/Tag";
import { TagItem } from "~/types";

type TagListProps = {
    type: string;
    initialWhere: Record<string, any>;
    onTagClick: (tag: TagItem) => void;
    emptyDisclaimer: string;
};

export const TagList: React.FC<TagListProps> = ({
    type,
    initialWhere,
    onTagClick,
    emptyDisclaimer
}) => {
    const { tags, loading, updateTag } = useTags({ type, ...initialWhere });

    if (loading.INIT || loading.LIST) {
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
