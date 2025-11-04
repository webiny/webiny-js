import React from "react";
import { cn, Text, TimeAgo } from "@webiny/admin-ui";
import type {
    CmsContentEntryStatusType,
    CmsIdentity
} from "@webiny/app-headless-cms-common/types/index.js";

interface ExcerptProps {
    modelName: string;
    createdBy: CmsIdentity;
    createdOn: Date;
    status: CmsContentEntryStatusType;
}

export const Excerpt = ({ modelName, createdOn, createdBy, status }: ExcerptProps) => {
    return (
        <Text size="sm" as="div" className={cn("truncate w-full text-neutral-muted")}>
            Model: {modelName} - Status: {status} - Created by {createdBy.displayName}{" "}
            <TimeAgo datetime={createdOn} />
        </Text>
    );
};
