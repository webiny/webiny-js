import React from "react";
import { Tag as AdminTag } from "@webiny/admin-ui";
import type { TagItem } from "@webiny/app-aco/types.js";

type TagProps = {
    tagItem: TagItem;
    active: boolean;
    onTagClick: (tagItem: TagItem) => void;
};

export const Tag = ({ tagItem, active, onTagClick }: TagProps) => {
    return (
        <div>
            <AdminTag
                variant={active ? "accent" : "neutral-muted"}
                content={tagItem.tag}
                onClick={() => onTagClick(tagItem)}
                onDismiss={active ? () => onTagClick(tagItem) : undefined}
            />
        </div>
    );
};
