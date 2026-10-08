import React from "react";
import { Tag } from "webiny/admin/ui";
import { ReactComponent as ArrowUpIcon } from "webiny/admin/icons/north_east.svg";
import { ReactComponent as ArrowDownIcon } from "webiny/admin/icons/south_east.svg";

// "+18.4%" in a green pill, or "-3.0%" in a neutral one. The arrow and the sign carry the
// direction, so it never relies on color alone.
export const ChangeTag = ({ percent }: { percent: number }) => {
    if (percent < 0) {
        return (
            <Tag
                variant={"neutral-muted"}
                icon={<ArrowDownIcon />}
                content={`${percent.toFixed(1)}%`}
            />
        );
    }

    return (
        <Tag variant={"success-light"} icon={<ArrowUpIcon />} content={`+${percent.toFixed(1)}%`} />
    );
};
