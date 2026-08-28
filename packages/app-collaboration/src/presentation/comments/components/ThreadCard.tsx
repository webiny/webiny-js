import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useSecurity } from "@webiny/app-admin";
import { Avatar, Button, DropdownMenu, IconButton, TimeAgo } from "@webiny/admin-ui";
import { ReactComponent as ArrowOutwardIcon } from "@webiny/icons/arrow_outward.svg";
import { ReactComponent as CheckCircleIcon } from "@webiny/icons/check_circle.svg";
import { ReactComponent as MoreHorizIcon } from "@webiny/icons/more_horiz.svg";
import { ReactComponent as LinkIcon } from "@webiny/icons/link.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import type { CommentsPresenter } from "../abstractions.js";
import { avatarColor, initials } from "../styles.js";
import { AutoTextarea } from "./AutoTextarea.js";
import { MentionTextarea } from "./MentionTextarea.js";
import { COLLAB_THREAD_PARAM, COLLAB_FIELD_PARAM } from "~/constants.js";
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
    // Tracks the per-message menu's open state purely so the "…" trigger stays visible
    // (its anchor is otherwise revealed on row hover only). DropdownMenu owns open/close.
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

export const ThreadCard = observer((props: Props) => {
    const { presenter, thread, onJumpToField } = props;
    const { identity } = useSecurity();
    const currentUserId = identity?.id;
    const [reply, setReply] = useState("");
    const [replyMentions, setReplyMentions] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);

    const messages = thread.messages.filter(message => !message.deleted);
    const mentionNames = presenter.vm.mentionableUsers.map(user => user.displayName);

    const highlighted = presenter.vm.highlightThreadId === thread.id;
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!highlighted || !rootRef.current) {
            return;
        }
        rootRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        const timer = window.setTimeout(() => presenter.clearHighlight(), 2600);
        return () => window.clearTimeout(timer);
    }, [highlighted, presenter]);

    const rootClassName = [
        "wby-collab-thread",
        thread.resolved ? "wby-collab-thread--resolved" : "",
        highlighted ? "wby-collab-thread--highlight" : ""
    ]
        .filter(Boolean)
        .join(" ");

    // Builds a shareable link to this thread by augmenting the current entry URL with the
    // deep-link query params. Opening it re-runs the panel-open + highlight + field-scroll flow.
    const copyThreadLink = () => {
        const url = new URL(window.location.href);
        url.searchParams.set(COLLAB_THREAD_PARAM, thread.id);
        if (thread.locator) {
            url.searchParams.set(COLLAB_FIELD_PARAM, thread.locator);
        } else {
            url.searchParams.delete(COLLAB_FIELD_PARAM);
        }
        const done = () => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        };
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(url.toString()).then(done, done);
        } else {
            done();
        }
    };

    const submitReply = async () => {
        if (!reply.trim() || busy) {
            return;
        }
        setBusy(true);
        try {
            await presenter.submitReply(thread.id, reply, replyMentions);
            setReply("");
            setReplyMentions([]);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={rootClassName} ref={rootRef}>
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
                    <Button
                        variant="tertiary"
                        size="sm"
                        icon={<CheckCircleIcon />}
                        text={thread.resolved ? "Reopen" : "Resolve"}
                        title={thread.resolved ? "Reopen thread" : "Resolve thread"}
                        onClick={() =>
                            thread.resolved
                                ? presenter.reopen(thread.id)
                                : presenter.resolve(thread.id)
                        }
                    />
                    <DropdownMenu
                        trigger={
                            <IconButton
                                variant="ghost"
                                size="sm"
                                icon={<MoreHorizIcon />}
                                title="More"
                                aria-label="More actions"
                            />
                        }
                    >
                        <DropdownMenu.Item
                            icon={<CheckCircleIcon />}
                            text={thread.resolved ? "Reopen thread" : "Resolve thread"}
                            onClick={() =>
                                thread.resolved
                                    ? presenter.reopen(thread.id)
                                    : presenter.resolve(thread.id)
                            }
                        />
                        <DropdownMenu.Item
                            icon={<LinkIcon />}
                            text={copied ? "Copied!" : "Copy link to thread"}
                            onClick={copyThreadLink}
                            preventClose
                        />
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item
                            variant="destructive"
                            icon={<DeleteIcon />}
                            text="Delete thread"
                            onClick={() => presenter.remove(thread.id)}
                        />
                    </DropdownMenu>
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
