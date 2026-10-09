import React, { useState } from "react";
import { ReactComponent as ExpandMoreIcon } from "@webiny/icons/expand_more.svg";
import { ReactComponent as ExpandLessIcon } from "@webiny/icons/expand_less.svg";
import type { CommentsPresenter } from "../abstractions.js";
import { ThreadList } from "./ThreadList.js";
import type { CollabThread } from "~/admin/types.js";

interface CollapsibleSectionProps {
    label: string;
    threads: CollabThread[];
    presenter: CommentsPresenter.Interface;
    onJumpToField: (locator: string) => void;
    defaultOpen?: boolean;
}

export const CollapsibleSection = ({
    label,
    threads,
    presenter,
    onJumpToField,
    defaultOpen = true
}: CollapsibleSectionProps) => {
    const [open, setOpen] = useState(defaultOpen);
    if (threads.length === 0) {
        return null;
    }
    return (
        <div className="wby-collab-group">
            <button className="wby-collab-section" onClick={() => setOpen(current => !current)}>
                {open ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                <span className="wby-collab-section__label">
                    {label} · {threads.length}
                </span>
            </button>
            {open ? (
                <ThreadList threads={threads} presenter={presenter} onJumpToField={onJumpToField} />
            ) : null}
        </div>
    );
};
