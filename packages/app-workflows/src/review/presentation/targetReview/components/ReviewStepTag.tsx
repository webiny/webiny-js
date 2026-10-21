import React from "react";
import { Tag } from "@webiny/admin-ui";
import { Tooltip } from "@webiny/admin-ui";
import type { TargetReviewTag } from "../abstractions.js";
import { REVIEW_TAG_ICONS } from "./reviewBarAppearance.js";

export interface ReviewStepTagProps {
    tag: TargetReviewTag;
    // The hover text (R264), or `null` for a tag without one.
    tooltip: string | null;
}

/*
 * A step-state tag with its optional icon (the running tag) and its optional tooltip (running and
 * failed). The bar and the progress popover render step tags through it.
 */
export const ReviewStepTag = (props: ReviewStepTagProps) => {
    const { tag, tooltip } = props;

    let icon: React.ReactElement | undefined = undefined;
    if (tag.icon) {
        const TagIcon = REVIEW_TAG_ICONS[tag.icon];
        icon = <TagIcon />;
    }

    const element = <Tag variant={tag.variant} content={tag.label} icon={icon} />;
    if (tooltip === null) {
        return element;
    }
    return <Tooltip trigger={element} content={tooltip} />;
};
