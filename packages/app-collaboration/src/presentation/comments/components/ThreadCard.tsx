import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { useSecurity } from "@webiny/app-admin";
import { ReactComponent as ArrowOutwardIcon } from "@webiny/icons/arrow_outward.svg";
import { ReactComponent as CheckCircleIcon } from "@webiny/icons/check_circle.svg";
import { ReactComponent as MoreHorizIcon } from "@webiny/icons/more_horiz.svg";
import { ReactComponent as LinkIcon } from "@webiny/icons/link.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import type { CommentsPresenter } from "../abstractions.js";
import { avatarColor, formatTimestamp, initials } from "../styles.js";
import { AutoTextarea } from "./AutoTextarea.js";
import { MentionTextarea } from "./MentionTextarea.js";
import type { CollabMessage, CollabThread } from "~/types.js";

interface Props {
    presenter: CommentsPresenter.Interface;
    thread: CollabThread;
    onJumpToField: (locator: string) => void;
}

const fieldLabel = (thread: CollabThread): string => {
    const path = thread.anchor.path || [];
    const label = thread.anchor.label || thread.locator;
    return [...path, label].join(" › ");
};

// Highlights @mentions. Known display names (matched longest-first) are highlighted in full,
// e.g. "@John Doe"; anything else falls back to the single `@token`.
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

const Message = ({
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
            await presenter.editMessage(threadId, message.id, draft);
            setEditing(false);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={rootClassName}>
            <span
                className={nested ? "wby-collab-avatar wby-collab-avatar--sm" : "wby-collab-avatar"}
                style={{ background: avatarColor(message.createdBy.displayName) }}
            >
                {initials(message.createdBy.displayName)}
            </span>
            <div className="wby-collab-msg__main">
                <div className="wby-collab-msg__meta">
                    <span className="wby-collab-msg__name">{message.createdBy.displayName}</span>
                    <span className="wby-collab-msg__right">
                        <span
                            className="wby-collab-msg__time"
                            title={new Date(message.createdOn).toLocaleString()}
                        >
                            {formatTimestamp(message.createdOn)}
                        </span>
                        {canManage && !editing ? (
                            <span className="wby-collab-msg__menu-anchor">
                                <button
                                    className="wby-collab-msgbtn"
                                    title="More"
                                    onClick={() => setMenuOpen(current => !current)}
                                >
                                    <MoreHorizIcon />
                                </button>
                                {menuOpen ? (
                                    <>
                                        <div
                                            className="wby-collab-backdrop"
                                            onClick={() => setMenuOpen(false)}
                                        />
                                        <div className="wby-collab-menu wby-collab-menu--compact">
                                            <button
                                                className="wby-collab-menuitem"
                                                onClick={() => {
                                                    setMenuOpen(false);
                                                    startEdit();
                                                }}
                                            >
                                                <EditIcon />
                                                Edit
                                            </button>
                                            <button
                                                className="wby-collab-menuitem wby-collab-menuitem--danger"
                                                onClick={() => {
                                                    setMenuOpen(false);
                                                    void presenter.deleteMessage(
                                                        threadId,
                                                        message.id
                                                    );
                                                }}
                                            >
                                                <DeleteIcon />
                                                Delete
                                            </button>
                                        </div>
                                    </>
                                ) : null}
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
                            <button
                                className="wby-collab-btn wby-collab-btn--ghost"
                                onClick={() => setEditing(false)}
                                disabled={busy}
                            >
                                Cancel
                            </button>
                            <button
                                className="wby-collab-btn wby-collab-btn--primary"
                                onClick={saveEdit}
                                disabled={busy || !draft.trim()}
                            >
                                Save
                            </button>
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

export const ThreadCard = observer((props: Props) => {
    const { presenter, thread, onJumpToField } = props;
    const { identity } = useSecurity();
    const currentUserId = identity?.id;
    const [reply, setReply] = useState("");
    const [replyMentions, setReplyMentions] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const messages = thread.messages.filter(message => !message.deleted);
    const mentionNames = presenter.vm.mentionableUsers.map(user => user.displayName);

    const submitReply = async () => {
        if (!reply.trim() || busy) {
            return;
        }
        setBusy(true);
        try {
            await presenter.reply(thread.id, reply, replyMentions);
            setReply("");
            setReplyMentions([]);
        } finally {
            setBusy(false);
        }
    };

    const copyLink = () => {
        setMenuOpen(false);
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            void navigator.clipboard.writeText(window.location.href);
        }
    };

    return (
        <div
            className={
                thread.resolved
                    ? "wby-collab-thread wby-collab-thread--resolved"
                    : "wby-collab-thread"
            }
        >
            <div className="wby-collab-thread__head">
                {thread.locator ? (
                    <button
                        className="wby-collab-chip"
                        title="Jump to field"
                        onClick={() => onJumpToField(thread.locator)}
                    >
                        <span className="wby-collab-chip__label">{fieldLabel(thread)}</span>
                        <ArrowOutwardIcon className="wby-collab-chip__jump" />
                    </button>
                ) : (
                    <span className="wby-collab-chip wby-collab-chip--entry">
                        <span className="wby-collab-chip__label">{fieldLabel(thread)}</span>
                    </span>
                )}

                <div className="wby-collab-thread__head-actions">
                    <button
                        className="wby-collab-pillbtn"
                        title={thread.resolved ? "Reopen thread" : "Resolve thread"}
                        onClick={() =>
                            thread.resolved
                                ? presenter.reopen(thread.id)
                                : presenter.resolve(thread.id)
                        }
                    >
                        <CheckCircleIcon className="wby-collab-ok" />
                        {thread.resolved ? "Reopen" : "Resolve"}
                    </button>
                    <button
                        className="wby-collab-iconbtn"
                        title="More"
                        onClick={() => setMenuOpen(current => !current)}
                    >
                        <MoreHorizIcon />
                    </button>

                    {menuOpen ? (
                        <>
                            <div
                                className="wby-collab-backdrop"
                                onClick={() => setMenuOpen(false)}
                            />
                            <div className="wby-collab-menu">
                                <button
                                    className="wby-collab-menuitem"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        thread.resolved
                                            ? presenter.reopen(thread.id)
                                            : presenter.resolve(thread.id);
                                    }}
                                >
                                    <CheckCircleIcon className="wby-collab-ok" />
                                    {thread.resolved ? "Reopen thread" : "Resolve thread"}
                                </button>
                                <button className="wby-collab-menuitem" onClick={copyLink}>
                                    <LinkIcon />
                                    Copy link
                                </button>
                                <div className="wby-collab-menu__divider" />
                                <button
                                    className="wby-collab-menuitem wby-collab-menuitem--danger"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        presenter.remove(thread.id);
                                    }}
                                >
                                    <DeleteIcon />
                                    Delete thread
                                </button>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>

            {thread.anchor.exists ? null : (
                <div className="wby-collab-banner">
                    This field no longer exists in the current revision.
                </div>
            )}

            {messages.map((message, index) => (
                <Message
                    key={message.id}
                    presenter={presenter}
                    threadId={thread.id}
                    message={message}
                    nested={index > 0}
                    canManage={!!currentUserId && currentUserId === message.createdBy.id}
                    mentionNames={mentionNames}
                />
            ))}

            {thread.resolved ? (
                <div className="wby-collab-resolved-by">
                    Resolved by {thread.resolvedBy?.displayName || "someone"}
                </div>
            ) : (
                <div className="wby-collab-replybar">
                    <MentionTextarea
                        className="wby-collab-reply-input"
                        value={reply}
                        placeholder="Reply…"
                        maxHeight={160}
                        users={presenter.vm.mentionableUsers}
                        excludeUserId={currentUserId}
                        onChange={setReply}
                        onMention={userId =>
                            setReplyMentions(current =>
                                current.includes(userId) ? current : [...current, userId]
                            )
                        }
                        onKeyDown={event => {
                            event.stopPropagation();
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                void submitReply();
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
});
