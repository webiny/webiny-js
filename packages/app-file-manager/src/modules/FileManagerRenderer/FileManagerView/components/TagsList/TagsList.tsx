import React, { useCallback } from "react";
import { Loader } from "@webiny/app-aco";
import { Empty } from "./Empty";
import { Tag } from "./Tag";
import { TagItem } from "@webiny/app-aco/types";
import { Select } from "@webiny/ui/Select";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import { Typography } from "@webiny/ui/Typography";
import { TagListWrapper } from "./styled";

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
        label: "Match any"
    },
    {
        value: "AND",
        label: "Match all"
    }
];

export const TagsList = ({
    loading,
    tags,
    emptyDisclaimer,
    onActivatedTagsChange,
    activeTags
}: TagListProps) => {
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
                <TagListWrapper>
                    <Typography use="subtitle1">Filter by tag</Typography>
                    {tags.length > 1 ? (
                        <Select
                            disabled={fmView.tags.activeTags.length < 2}
                            size={"small"}
                            value={fmView.tags.filterMode}
                            onChange={mode => fmView.tags.setFilterMode(mode)}
                            options={options}
                            className="tag-filter"
                        />
                    ) : null}
                </TagListWrapper>

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
