import React from "react";
import { Tag } from "webiny/admin/ui";
import { ReactComponent as ArrowUpIcon } from "webiny/admin/icons/north_east.svg";

// "+18.4%" in a green pill, with an arrow so the change never relies on color alone.
export const ChangeTag = ({ percent }: { percent: number }) => {
    return (
        <Tag variant={"success-light"} icon={<ArrowUpIcon />} content={`+${percent.toFixed(1)}%`} />
    );
};
