import React, { useCallback } from "react";
import { Loader } from "./Loader";
import { Empty } from "./Empty";
import { Tag } from "./Tag";
import { TagItem } from "@webiny/app-aco/types";
import { Select } from "@webiny/ui/Select";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";

interface TagListProps {
    loading: boolean;
    onActivatedTagsChange: (tags: string[]) => void;
    tags: TagItem[];
    activeTags: string[];
    emptyDisclaimer?: string;
}

const options = [
    {
        value: "OR",
        label: "Match any tag"
    },
    {
        value: "AND",
        label: "Match all tags"
    }
];

export const TagsList: React.VFC<TagListProps> = ({
    loading,
    tags,
    emptyDisclaimer,
    onActivatedTagsChange,
    activeTags
}) => {
    const fmView = useFileManagerView();

    const toggleTag = useCallback(
        (tag: TagItem["tag"]) => {
            const finalTags = Array.isArray(activeTags) ? [...activeTags] : [];

            if (finalTags.find(item => tag === item)) {
                finalTags.splice(finalTags.indexOf(tag), 1);
            } else {
                finalTags.push(tag);
            }

            onActivatedTagsChange(finalTags);
        },
        [activeTags]
    );

    if (loading) {
        return <Loader />;
    }

    if (tags.length > 0) {
        return (
            <>
                {tags.length > 1 ? (
                    <Select
                        disabled={fmView.tags.activeTags.length < 2}
                        size={"medium"}
                        value={fmView.tags.filterMode}
                        onChange={mode => fmView.tags.setFilterMode(mode)}
                        options={options}
                    />
                ) : null}

                {tags.map((tagItem, index) => (
                    <Tag
                        key={`tag-${index}`}
                        tagItem={tagItem}
                        active={activeTags.includes(tagItem.tag)}
                        onTagClick={tagItem => {
                            toggleTag(tagItem.tag);
                        }}
                    />
                ))}
            </>
        );
    }

    return <Empty disclaimer={emptyDisclaimer} />;
};
