import React, { useState } from "react";
import { Avatar, Button, DropdownMenu, IconButton, TimeAgo } from "@webiny/admin-ui";
import { ReactComponent as MoreHorizIcon } from "@webiny/icons/more_horiz.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import type { CommentsPresenter } from "../abstractions.js";
import { avatarColor, initials } from "../styles.js";
import { AutoTextarea } from "./AutoTextarea.js";
import type { CollabMessage } from "~/admin/types.js";

const renderBody = (body: string, names: string[]) => {
    const known = [...names].filter(Boolean).sort((a, b) => b.length - a.length);
    const parts: React.ReactNode[] = [];
    let buffer = "";
    let key = 0;
    let i = 0;

    const flush = () => {
        if (buffer) {
            parts.push(<React.Fragment key={key++}>{buffer}</React.Fragment>);
            buffer = "";
        }
    };

    while (i < body.length) {
        if (body[i] === "@") {
            const rest = body.slice(i + 1);
            const name = known.find(candidate => rest.startsWith(candidate));
            const token = name ?? rest.match(/^[^\s]+/)?.[0];
            if (token) {
                flush();
                parts.push(
                    <span key={key++} className="wby-collab-mention">
                        @{token}
                    </span>
                );
                i += 1 + token.length;
                continue;
            }
        }
        buffer += body[i];
        i++;
    }

    flush();
    return parts;
};

interface MessageProps {
    presenter: CommentsPresenter.Interface;
    threadId: string;
    message: CollabMessage;
    nested: boolean;
    canManage: boolean;
    mentionNames: string[];
}

export const Message = ({
    presenter,
    threadId,
    message,
    nested,
    canManage,
    mentionNames
}: MessageProps) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(message.body);
    const [busy, setBusy] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const rootClassName = [
        "wby-collab-msg",
        nested ? "wby-collab-reply" : "",
        canManage ? "wby-collab-msg--manageable" : "",
        menuOpen ? "is-menu-open" : ""
    ]
        .filter(Boolean)
        .join(" ");

    const startEdit = () => {
        setDraft(message.body);
        setEditing(true);
    };

    const saveEdit = async () => {
        if (!draft.trim() || busy) {
            return;
        }
        setBusy(true);
        try {
            await presenter.submitMessageEdit(threadId, message.id, draft);
            setEditing(false);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={rootClassName}>
            <Avatar
                size="sm"
                fallback={
                    <Avatar.Fallback
                        style={{
                            backgroundColor: avatarColor(message.createdBy.displayName),
                            color: "#fff"
                        }}
                    >
                        {initials(message.createdBy.displayName)}
                    </Avatar.Fallback>
                }
            />
            <div className="wby-collab-msg__main">
                <div className="wby-collab-msg__meta">
                    <span className="wby-collab-msg__name">{message.createdBy.displayName}</span>
                    <span className="wby-collab-msg__right">
                        <TimeAgo
                            className="wby-collab-msg__time"
                            datetime={message.createdOn}
                            title={new Date(message.createdOn).toLocaleString()}
                        />
                        {canManage && !editing ? (
                            <span className="wby-collab-msg__menu-anchor">
                                <DropdownMenu
                                    open={menuOpen}
                                    onOpenChange={setMenuOpen}
                                    trigger={
                                        <IconButton
                                            variant="ghost"
                                            size="xs"
                                            icon={<MoreHorizIcon />}
                                            title="More"
                                            aria-label="More actions"
                                        />
                                    }
                                >
                                    <DropdownMenu.Item
                                        icon={<EditIcon />}
                                        text="Edit"
                                        onClick={startEdit}
                                    />
                                    <DropdownMenu.Item
                                        variant="destructive"
                                        icon={<DeleteIcon />}
                                        text="Delete"
                                        onClick={() =>
                                            void presenter.deleteMessage(threadId, message.id)
                                        }
                                    />
                                </DropdownMenu>
                            </span>
                        ) : null}
                    </span>
                </div>
                {editing ? (
                    <div className="wby-collab-msg__edit">
                        <AutoTextarea
                            className="wby-collab-reply-input"
                            value={draft}
                            autoFocus
                            maxHeight={200}
                            onChange={setDraft}
                            onKeyDown={event => {
                                event.stopPropagation();
                                if (event.key === "Enter" && !event.shiftKey) {
                                    event.preventDefault();
                                    void saveEdit();
                                }
                                if (event.key === "Escape") {
                                    setEditing(false);
                                }
                            }}
                        />
                        <div className="wby-collab-msg__edit-actions">
                            <Button
                                variant="ghost"
                                size="sm"
                                text="Cancel"
                                onClick={() => setEditing(false)}
                                disabled={busy}
                            />
                            <Button
                                variant="primary"
                                size="sm"
                                text="Save"
                                onClick={saveEdit}
                                disabled={busy || !draft.trim()}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="wby-collab-msg__body">
                        {renderBody(message.body, mentionNames)}
                    </div>
                )}
            </div>
        </div>
    );
};
