import React from "react";
import { Tag, Tooltip } from "@webiny/admin-ui";
import { useDateFormatter } from "@webiny/app-admin";

interface LiveTagProps {
    version: number;
    lastPublishedOn?: string | null;
}

export const LiveTag = ({ version, lastPublishedOn }: LiveTagProps) => {
    const dateFormatter = useDateFormatter();

    const tag = (
        <Tag swatchColor={"#5AC84C"} variant={"success-light"} content={`Live (v${version})`} />
    );

    if (lastPublishedOn) {
        return (
            <Tooltip content={`Published ${dateFormatter.format(lastPublishedOn)}`} trigger={tag} />
        );
    }

    return tag;
};
