import React, { useCallback } from "react";
import { Tag as AdminTag } from "@webiny/admin-ui";
import type { TagItem } from "@webiny/app-aco/types.js";

export interface TagsProps {
    tags: TagItem[];
    activeTags: string[];
    onActivatedTagsChange: (tags: string[]) => void;
}

export const Tags = ({ tags, activeTags, onActivatedTagsChange }: TagsProps) => {
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

    const getIsActive = useCallback(
        (tagItem: TagItem) => {
            return activeTags.includes(tagItem.tag);
        },
        [activeTags]
    );

    return (
        <div className={"flex flex-col gap-sm"}>
            {tags.map((tagItem, index) => (
                <div key={`tag-${index}`}>
                    <AdminTag
                        variant={getIsActive(tagItem) ? "accent" : "neutral-muted"}
                        content={tagItem.tag}
                        onClick={() => toggleTag(tagItem.tag)}
                        onDismiss={getIsActive(tagItem) ? () => toggleTag(tagItem.tag) : undefined}
                    />
                </div>
            ))}
        </div>
    );
};
