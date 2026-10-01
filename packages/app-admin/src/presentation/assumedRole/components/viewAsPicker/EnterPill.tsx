import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as ReturnIcon } from "@webiny/icons/keyboard_return.svg";

// The highlighted row's "what enter does" pill, matching the palette's own rows.
export const EnterPill = ({ verb }: { verb: string }) => (
    <span className="inline-flex shrink-0 items-center gap-xs rounded-sm bg-primary px-xs py-xs text-sm font-medium text-neutral-base">
        {verb}
        <Icon icon={<ReturnIcon />} color={"neutral-base"} size={"xs"} label={""} />
    </span>
);
