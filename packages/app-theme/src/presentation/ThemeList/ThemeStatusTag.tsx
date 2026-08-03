import React from "react";
import { Tag } from "@webiny/admin-ui";
import { ReactComponent as CheckCircleIcon } from "@webiny/icons/check_circle.svg";
import { ThemeStatus } from "~/constants.js";

interface ThemeStatusTagProps {
    status: string;
    isActive: boolean;
}

/**
 * Which theme is active is the single most important thing on the list screen, so it gets the one
 * filled, high-contrast tag on the page. Everything else is a quiet outline.
 */
export const ThemeStatusTag = ({ status, isActive }: ThemeStatusTagProps) => {
    if (isActive) {
        return <Tag variant="accent" icon={<CheckCircleIcon />} content="Active" />;
    }

    if (status === ThemeStatus.Published || status === ThemeStatus.Unpublished) {
        return <Tag variant="neutral-light" content="Published" />;
    }

    return <Tag variant="neutral-light" content="Draft" />;
};
